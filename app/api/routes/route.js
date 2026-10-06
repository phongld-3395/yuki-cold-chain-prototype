import { requireApi, ok } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export async function GET() {
  const { error } = await requireApi(); if (error) return error;
  const { data } = await supabaseAdmin().from('routes').select('*, stops:route_stops(id)').order('route_date').order('route_code');
  return ok({ routes: data || [] });
}
