import { requireApi, ok, bad, audit } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { loadAndCheck } from '@/lib/routeCheck';
export const dynamic = 'force-dynamic';
// Vi phạm giờ lái = ràng buộc cứng → cấm publish
export async function POST(_req, { params }) {
  const { user, error } = await requireApi(['planner']); if (error) return error;
  const { route, rule, result } = await loadAndCheck(params.id);
  if (!route) return bad('Không tìm thấy tuyến.', 404);
  const db = supabaseAdmin();
  await db.from('routes').update({ last_check: result }).eq('id', route.id);
  if (!result.ok) return bad('Tuyến vi phạm giới hạn giờ lái – không được publish.', 422, { result });
  if (route.status === 'PUBLISHED') return bad('Tuyến đã được publish.', 409);
  const patch = { status: 'PUBLISHED', rule_version: rule.version, published_at: new Date().toISOString(), published_by: user.id };
  await db.from('routes').update(patch).eq('id', route.id);
  await audit(user, 'PUBLISH_ROUTE', 'routes', route.id, { status: route.status, version: route.version }, { ...patch, version: route.version });
  return ok({ result, published: true });
}
