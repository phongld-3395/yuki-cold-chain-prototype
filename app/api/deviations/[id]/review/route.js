import { requireApi, ok, bad, audit } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
// QA quyết định RELEASE / SCRAP – bắt buộc lý do; không tự release (FR-INV-05, FR-TEMP-04)
export async function POST(req, { params }) {
  const { user, error } = await requireApi(['qa']); if (error) return error;
  const { decision, rationale } = await req.json();
  if (!['RELEASE', 'SCRAP'].includes(decision)) return bad('Chọn quyết định RELEASE hoặc SCRAP.');
  if (!rationale || rationale.trim().length < 5) return bad('Phải ghi lý do quyết định (ít nhất 5 ký tự).', 400, { fields: ['rationale'] });
  const db = supabaseAdmin();
  const { data: dev } = await db.from('deviations').select('*').eq('id', params.id).single();
  if (!dev) return bad('Không tìm thấy deviation.', 404);
  if (dev.status !== 'OPEN') return bad('Deviation này đã được xử lý.', 409);
  const { data: after } = await db.from('deviations').update({ status: 'CLOSED', decision, rationale: rationale.trim(),
    reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', dev.id).select().single();
  if (dev.lot_id) {
    const patch = decision === 'RELEASE' ? { status: 'RELEASED' } : { status: 'SCRAPPED', qty_available: 0 };
    await db.from('lots').update(patch).eq('id', dev.lot_id);
  }
  await audit(user, `DEVIATION_${decision}`, 'deviations', dev.id, dev, after, rationale.trim());
  return ok({ deviation: after });
}
