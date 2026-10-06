import { requireApi, ok } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export async function GET() {
  const { error } = await requireApi(); if (error) return error;
  const { data } = await supabaseAdmin().from('deviations')
    .select('*, lot:lots(id, lot_code, sku_code, status, qty_available, location_code)').order('detected_at', { ascending: false });
  return ok({ deviations: data || [] });
}
