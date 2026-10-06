import { requireApi, ok, bad, audit } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { DEMO_DATE } from '@/lib/config';
export const dynamic = 'force-dynamic';

// Kiểm hàng nhập 1 dòng (FR-REC-02/04/05, BR-TEMP-02, BR-TRACE-01/02)
export async function POST(req) {
  const { user, error } = await requireApi(['receiving', 'warehouse']); if (error) return error;
  const b = await req.json();
  const required = ['sku_code', 'supplier_code', 'lot_code', 'manufactured_on', 'expiry_date', 'qty', 'measured_temp_c', 'location_code'];
  const missing = required.filter((k) => b[k] === undefined || b[k] === null || String(b[k]).trim() === '');
  if (!b.photo_taken) missing.push('photo_taken');
  if (missing.length) return bad('Thiếu thông tin bắt buộc – chưa thể xác nhận dòng nhập.', 400, { fields: missing });
  if (b.expiry_date <= b.manufactured_on) return bad('Hạn in trên nhãn phải sau ngày sản xuất.', 400, { fields: ['expiry_date'] });
  if (!(Number(b.qty) > 0)) return bad('Số lượng phải lớn hơn 0.', 400, { fields: ['qty'] });

  const db = supabaseAdmin();
  const [{ data: sku }, { data: loc }] = await Promise.all([
    db.from('skus').select('*').eq('sku_code', b.sku_code).single(),
    db.from('locations').select('*').eq('location_code', b.location_code).single(),
  ]);
  if (!sku || !loc) return bad('SKU hoặc vị trí không tồn tại.');
  if (sku.trace_lane === 'BEEF' && !/^[0-9]{10}$/.test(b.beef_id || '')) return bad('SKU thịt bò bắt buộc mã cá thể 10 chữ số.', 400, { fields: ['beef_id'] });
  if (sku.trace_lane === 'RICE' && !String(b.rice_origin || '').trim()) return bad('SKU gạo bắt buộc ghi xuất xứ gạo.', 400, { fields: ['rice_origin'] });
  if (loc.band !== sku.band) return bad(`Vị trí ${loc.location_code} thuộc dải ${loc.band}, SKU yêu cầu ${sku.band}. Chọn vị trí đúng dải nhiệt.`, 400, { fields: ['location_code'] });

  const { data: band } = await db.from('temperature_band_versions').select('*').eq('band', sku.band)
    .lte('effective_from', DEMO_DATE).order('version', { ascending: false }).limit(1).single();
  const t = Number(b.measured_temp_c);
  const out = (band.min_c !== null && t < Number(band.min_c)) || (band.max_c !== null && t > Number(band.max_c));

  const { data: lot, error: e } = await db.from('lots').insert({
    lot_code: String(b.lot_code).trim(), sku_code: sku.sku_code, supplier_code: b.supplier_code, location_code: loc.location_code,
    manufactured_on: b.manufactured_on, expiry_date: b.expiry_date, expiry_type: sku.expiry_type,
    qty_received: Number(b.qty), qty_available: Number(b.qty), measured_temp_c: t, band_version_id: band.id,
    beef_id: sku.trace_lane === 'BEEF' ? b.beef_id : null, rice_origin: sku.trace_lane === 'RICE' ? b.rice_origin : null,
    status: out ? 'QUARANTINE' : 'AVAILABLE', received_by: user.id,
  }).select().single();
  if (e) return e.code === '23505' ? bad(`Mã lô "${b.lot_code}" đã tồn tại.`, 409, { fields: ['lot_code'] }) : bad(e.message, 500);

  let deviation = null;
  if (out) {
    const r = await db.from('deviations').insert({ lot_id: lot.id, measured_c: t, band: sku.band,
      band_min_c: band.min_c, band_max_c: band.max_c, detected_by: user.id }).select().single();
    deviation = r.data;
  }
  await audit(user, out ? 'RECEIVE_QUARANTINE' : 'RECEIVE', 'lots', lot.id, null, lot);
  return ok({ lot, deviation, quarantined: out, band });
}
