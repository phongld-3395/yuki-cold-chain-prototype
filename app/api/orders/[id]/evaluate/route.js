import { requireApi, ok, bad } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { evaluateLine } from '@/lib/evaluate';
export const dynamic = 'force-dynamic';
// Đánh giá phân bổ cho mọi dòng đơn còn OPEN; dòng đã phân bổ trả về phân bổ thực tế
export async function GET(_req, { params }) {
  const { error } = await requireApi(); if (error) return error;
  const db = supabaseAdmin();
  const { data: order } = await db.from('sales_orders').select('*, customer:customers(*), lines:order_lines(*, sku:skus(*))').eq('id', params.id).single();
  if (!order) return bad('Không tìm thấy đơn hàng.', 404);
  const lines = [];
  for (const line of order.lines.sort((a, b) => a.id - b.id)) {
    if (line.status === 'OPEN') lines.push({ line, result: await evaluateLine(line, order) });
    else {
      const { data: allocations } = await db.from('allocations').select('*, lot:lots(lot_code, expiry_date)').eq('order_line_id', line.id);
      lines.push({ line, allocations });
    }
  }
  return ok({ order, lines });
}
