import { requireApi, ok, bad, audit } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { loadAndCheck } from '@/lib/routeCheck';
export const dynamic = 'force-dynamic';
export async function GET(_req, { params }) {
  const { error } = await requireApi(); if (error) return error;
  const { route, rule, result } = await loadAndCheck(params.id);
  if (!route) return bad('Không tìm thấy tuyến.', 404);
  route.stops.sort((a, b) => a.seq - b.seq);
  return ok({ route, rule, result });
}
// Sửa điểm dừng. Tuyến đã publish: bắt buộc lý do, tăng version, quay về DRAFT để kiểm tra lại (FR-SCH-04)
export async function PUT(req, { params }) {
  const { user, error } = await requireApi(['planner']); if (error) return error;
  const { stops, depot_start, reason } = await req.json();
  const db = supabaseAdmin();
  const { data: before } = await db.from('routes').select('*, stops:route_stops(*)').eq('id', params.id).single();
  if (!before) return bad('Không tìm thấy tuyến.', 404);
  if (before.status === 'PUBLISHED' && !reason?.trim()) return bad('Tuyến đã publish – phải ghi lý do thay đổi.', 400, { fields: ['reason'] });
  const clean = (stops || []).map((s, i) => ({ route_id: before.id, seq: i + 1, customer_code: s.customer_code || null,
    drive_min: Math.max(0, Number(s.drive_min) || 0), service_min: Math.max(0, Number(s.service_min) || 0), break_min: Math.max(0, Number(s.break_min) || 0) }));
  await db.from('route_stops').delete().eq('route_id', before.id);
  if (clean.length) await db.from('route_stops').insert(clean);
  const patch = { depot_start: depot_start || before.depot_start, last_check: null };
  if (before.status === 'PUBLISHED') Object.assign(patch, { status: 'DRAFT', version: before.version + 1, change_reason: reason.trim() });
  await db.from('routes').update(patch).eq('id', before.id);
  await audit(user, 'UPDATE_ROUTE', 'routes', before.id, before, { ...patch, stops: clean }, reason);
  return ok({ saved: true });
}
