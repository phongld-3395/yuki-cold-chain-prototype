import { requireApi, ok, bad } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export async function GET(_req, { params }) {
  const { error } = await requireApi(); if (error) return error;
  const db = supabaseAdmin();
  const { data: lot } = await db.from('lots').select('*, sku:skus(*), supplier:suppliers(name), location:locations(*)').eq('id', params.id).single();
  if (!lot) return bad('Không tìm thấy lô.', 404);
  const [al, dl, dv] = await Promise.all([
    db.from('allocations').select('*, line:order_lines(id, sku_code, order:sales_orders(order_no, customer_code))').eq('lot_id', lot.id),
    db.from('deliveries').select('*').eq('lot_id', lot.id),
    db.from('deviations').select('*').eq('lot_id', lot.id),
  ]);
  return ok({ lot, allocations: al.data, deliveries: dl.data, deviations: dv.data });
}
