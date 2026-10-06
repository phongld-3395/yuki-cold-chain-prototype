import { requireApi, ok, bad, audit } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export async function GET() {
  const { error } = await requireApi(); if (error) return error;
  const { data } = await supabaseAdmin().from('sales_orders')
    .select('*, customer:customers(name, delivery_term), lines:order_lines(*, sku:skus(name, band, expiry_type))')
    .order('requested_date', { ascending: false }).order('order_no');
  return ok({ orders: data || [] });
}
export async function POST(req) {
  const { user, error } = await requireApi(['sales', 'planner']); if (error) return error;
  const { customer_code, requested_date, lines } = await req.json();
  const valid = (lines || []).filter((l) => l.sku_code && Number(l.qty) > 0);
  if (!customer_code || !requested_date || !valid.length) return bad('Cần chọn khách hàng, ngày giao và ít nhất 1 dòng hàng có số lượng.');
  const db = supabaseAdmin();
  const order_no = 'SO-' + String(Date.now()).slice(-6);
  const { data: order, error: e } = await db.from('sales_orders').insert({ order_no, customer_code, requested_date }).select().single();
  if (e) return bad(e.message, 500);
  await db.from('order_lines').insert(valid.map((l) => ({ order_id: order.id, sku_code: l.sku_code, qty: Number(l.qty) })));
  await audit(user, 'CREATE_ORDER', 'sales_orders', order.id, null, { ...order, lines: valid });
  return ok({ order });
}
