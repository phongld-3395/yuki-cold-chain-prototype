import { requireApi, ok } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export async function GET() {
  const { error } = await requireApi(['qa']); if (error) return error;
  const { data } = await supabaseAdmin().from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
  return ok({ logs: data || [] });
}
