import { requireApi, ok, bad, audit } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { evaluateLine } from '@/lib/evaluate';
export const dynamic = 'force-dynamic';
// Tính lại phía server (không tin dữ liệu client) rồi phân bổ nguyên tử qua hàm allocate_line
export async function POST(req, { params }) {
  const { user, error } = await requireApi(['planner']); if (error) return error;
  const { line_id } = await req.json();
  const db = supabaseAdmin();
  const { data: order } = await db.from('sales_orders').select('*').eq('id', params.id).single();
  const { data: line } = await db.from('order_lines').select('*').eq('id', line_id).eq('order_id', params.id).single();
  if (!order || !line) return bad('Không tìm thấy dòng đơn.', 404);
  if (line.status !== 'OPEN') return bad('Dòng đơn này đã được phân bổ.', 409);
  const r = await evaluateLine(line, order);
  if (r.businessReview) return bad('Hợp đồng khách–SKU chưa chốt quy tắc delivery window (BUSINESS-REVIEW). Không thể phân bổ.', 422);
  if (r.shortage > 0) return bad(`Thiếu ${r.shortage} đơn vị lô hợp lệ – không phân bổ một phần.`, 422);
  const evidence = { delivery_date: order.requested_date, window_rule: r.rule, last_delivered: r.lastDelivered,
    excluded: r.rows.filter((x) => !x.eligible).map((x) => ({ lot: x.lot.lot_code, failed: x.checks.filter((c) => !c.ok).map((c) => c.detail) })) };
  const { error: e } = await db.rpc('allocate_line', { p_line_id: line.id, p_lot_ids: r.plan.map((p) => p.lot_id),
    p_qtys: r.plan.map((p) => p.qty), p_actor: user.id, p_evidence: evidence });
  if (e) return bad(e.message.includes('INSUFFICIENT') ? 'Tồn vừa thay đổi (có người phân bổ cùng lúc). Tải lại và thử lại.' : e.message, 409);
  await audit(user, 'ALLOCATE', 'order_lines', line.id, null, { plan: r.plan, evidence });
  return ok({ plan: r.plan });
}
