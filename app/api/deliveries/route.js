import { requireApi, ok } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export async function GET(req) {
  const { error } = await requireApi(); if (error) return error;
  const status = new URL(req.url).searchParams.get('status');
  let q = supabaseAdmin().from('deliveries')
    .select('*, customer:customers(name, delivery_term), sku:skus(name), lot:lots(lot_code), pods(*)').order('id', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data } = await q;
  return ok({ deliveries: data || [] });
}
