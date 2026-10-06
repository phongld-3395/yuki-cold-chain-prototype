import { requireApi, ok, bad } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
// Truy xuất theo mã lô / mã cá thể bò 10 số / xuất xứ gạo (FR-TRC-01, BR-TRACE-01..03)
export async function GET(req) {
  const { error } = await requireApi(); if (error) return error;
  const q = (new URL(req.url).searchParams.get('q') || '').trim();
  if (!q) return bad('Nhập mã lô, mã cá thể bò hoặc xuất xứ gạo.');
  const db = supabaseAdmin();
  const sel = '*, sku:skus(name, band, trace_lane), supplier:suppliers(name)';
  let lots;
  if (/^[0-9]{10}$/.test(q)) ({ data: lots } = await db.from('lots').select(sel).eq('beef_id', q));
  else {
    const [a, b] = await Promise.all([db.from('lots').select(sel).ilike('lot_code', `%${q}%`), db.from('lots').select(sel).ilike('rice_origin', `%${q}%`)]);
    const m = new Map(); [...(a.data || []), ...(b.data || [])].forEach((l) => m.set(l.id, l)); lots = [...m.values()];
  }
  const results = [];
  for (const lot of lots || []) {
    const [al, dl] = await Promise.all([
      db.from('allocations').select('qty, created_at, line:order_lines(order:sales_orders(order_no, customer_code))').eq('lot_id', lot.id),
      db.from('deliveries').select('*, customer:customers(name)').eq('lot_id', lot.id),
    ]);
    results.push({ lot, allocations: al.data || [], deliveries: dl.data || [] });
  }
  return ok({ query: q, mode: /^[0-9]{10}$/.test(q) ? 'BEEF' : 'LOT_OR_RICE', results });
}
