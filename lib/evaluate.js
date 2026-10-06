import { supabaseAdmin } from './supabase';
import { evaluateLots } from './rules/allocation.mjs';

// Gom dữ liệu từ Supabase rồi chạy luật phân bổ cho 1 dòng đơn
export async function evaluateLine(line, order) {
  const db = supabaseAdmin();
  const [{ data: sku }, { data: agreement }, { data: lots }, { data: last }] = await Promise.all([
    db.from('skus').select('*').eq('sku_code', line.sku_code).single(),
    db.from('customer_sku_agreements').select('*').eq('customer_code', order.customer_code).eq('sku_code', line.sku_code).maybeSingle(),
    db.from('lots').select('*, location:locations(band)').eq('sku_code', line.sku_code),
    db.from('deliveries').select('expiry_date, delivered_at, lot_id')
      .eq('customer_code', order.customer_code).eq('sku_code', line.sku_code).eq('status', 'DELIVERED')
      .order('delivered_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  const prepared = (lots || []).map((l) => ({ ...l, location_band: l.location?.band }));
  return evaluateLots({ sku, agreement, lots: prepared, lastDelivered: last, deliveryDate: order.requested_date, qtyNeeded: line.qty });
}
