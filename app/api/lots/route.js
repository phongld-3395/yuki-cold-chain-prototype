import { requireApi, ok } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export async function GET(req) {
  const { error } = await requireApi(); if (error) return error;
  const p = new URL(req.url).searchParams;
  let q = supabaseAdmin().from('lots').select('*, sku:skus(name, band, trace_lane)').order('expiry_date');
  if (p.get('status')) q = q.eq('status', p.get('status'));
  if (p.get('sku')) q = q.eq('sku_code', p.get('sku'));
  if (p.get('expiry_type')) q = q.eq('expiry_type', p.get('expiry_type'));
  if (p.get('q')) q = q.ilike('lot_code', `%${p.get('q')}%`);
  const { data } = await q;
  const band = p.get('band');
  return ok({ lots: (data || []).filter((l) => !band || l.sku?.band === band) });
}
