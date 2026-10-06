import { requireApi, ok, bad } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { loadAndCheck } from '@/lib/routeCheck';
export const dynamic = 'force-dynamic';
export async function POST(_req, { params }) {
  const { error } = await requireApi(['planner']); if (error) return error;
  const { route, result } = await loadAndCheck(params.id);
  if (!route) return bad('Không tìm thấy tuyến.', 404);
  await supabaseAdmin().from('routes').update({ last_check: result }).eq('id', route.id);
  return ok({ result });
}
