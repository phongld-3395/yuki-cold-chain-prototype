import { requireApi, ok, bad, audit } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export async function GET() {
  const { error } = await requireApi(); if (error) return error;
  const db = supabaseAdmin();
  const { data: lines } = await db.from('order_lines')
    .select('*, order:sales_orders(id, order_no, customer_code, requested_date), sku:skus(name, band), allocations(qty, lot:lots(lot_code, expiry_date))')
    .eq('status', 'ALLOCATED').order('id');
  const { data: routes } = await db.from('routes').select('id, route_code, route_date, status, vehicle_band').order('route_code');
  return ok({ lines: lines || [], routes: routes || [] });
}
// Xác nhận xuất: tạo bản ghi giao IN_TRANSIT cho từng phân bổ (mock: không quét mã vạch / seal)
export async function POST(req) {
  const { user, error } = await requireApi(['warehouse', 'planner']); if (error) return error;
  const { line_id, route_id } = await req.json();
  const db = supabaseAdmin();
  const { data: line } = await db.from('order_lines').select('*, order:sales_orders(*), allocations(*, lot:lots(expiry_date))').eq('id', line_id).single();
  if (!line) return bad('Không tìm thấy dòng đơn.', 404);
  if (line.status !== 'ALLOCATED') return bad('Chỉ xuất được dòng đã phân bổ.', 409);
  const rows = line.allocations.map((a) => ({ customer_code: line.order.customer_code, sku_code: line.sku_code, lot_id: a.lot_id,
    expiry_date: a.lot.expiry_date, qty: a.qty, order_line_id: line.id, route_id: route_id || null }));
  const { data: deliveries, error: e } = await db.from('deliveries').insert(rows).select();
  if (e) return bad(e.message, 500);
  await db.from('order_lines').update({ status: 'SHIPPED' }).eq('id', line.id);
  const { count } = await db.from('order_lines').select('*', { count: 'exact', head: true }).eq('order_id', line.order_id).neq('status', 'SHIPPED');
  if (!count) await db.from('sales_orders').update({ status: 'SHIPPED' }).eq('id', line.order_id);
  await audit(user, 'SHIP', 'order_lines', line.id, null, { deliveries });
  return ok({ deliveries });
}
