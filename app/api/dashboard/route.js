import { requireApi, ok } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export async function GET() {
  const { error } = await requireApi(); if (error) return error;
  const db = supabaseAdmin();
  const c = (q) => q.then((r) => r.count ?? 0);
  const [quarantine, openDev, openLines, draftRoutes, inTransit, recentDev] = await Promise.all([
    c(db.from('lots').select('*', { count: 'exact', head: true }).eq('status', 'QUARANTINE')),
    c(db.from('deviations').select('*', { count: 'exact', head: true }).eq('status', 'OPEN')),
    c(db.from('order_lines').select('*', { count: 'exact', head: true }).eq('status', 'OPEN')),
    c(db.from('routes').select('*', { count: 'exact', head: true }).eq('status', 'DRAFT')),
    c(db.from('deliveries').select('*', { count: 'exact', head: true }).eq('status', 'IN_TRANSIT')),
    db.from('deviations').select('id, measured_c, band, detected_at, status, lot:lots(id, lot_code, sku_code)').order('detected_at', { ascending: false }).limit(5).then((r) => r.data || []),
  ]);
  return ok({ quarantine, openDev, openLines, draftRoutes, inTransit, recentDev });
}
