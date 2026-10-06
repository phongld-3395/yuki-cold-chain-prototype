import { requireApi, ok } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
// Danh mục dùng chung cho các màn hình (SKU, khách, NCC, vị trí, hợp đồng, ngưỡng nhiệt)
export async function GET() {
  const { error } = await requireApi(); if (error) return error;
  const db = supabaseAdmin();
  const [skus, customers, suppliers, locations, agreements, bands] = await Promise.all([
    db.from('skus').select('*').order('sku_code'),
    db.from('customers').select('*').order('customer_code'),
    db.from('suppliers').select('*').order('supplier_code'),
    db.from('locations').select('*').order('location_code'),
    db.from('customer_sku_agreements').select('*').order('customer_code').order('sku_code'),
    db.from('temperature_band_versions').select('*').order('band').order('version'),
  ]);
  return ok({ skus: skus.data, customers: customers.data, suppliers: suppliers.data, locations: locations.data, agreements: agreements.data, bands: bands.data });
}
