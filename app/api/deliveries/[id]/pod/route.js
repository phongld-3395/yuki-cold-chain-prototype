import { requireApi, ok, bad, audit } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
// BR-POD-01: bằng chứng bắt buộc khác nhau theo điều kiện giao (mock: ảnh/chữ ký là ô đánh dấu)
const REQUIRED = { ON_TRUCK: ['has_signature'], DOORSTEP: ['has_signature', 'has_photo'] };
const LABEL = { has_signature: 'Chữ ký người nhận', has_photo: 'Ảnh hàng tại điểm giao' };
export async function POST(req, { params }) {
  const { user, error } = await requireApi(['driver']); if (error) return error;
  const b = await req.json();
  const db = supabaseAdmin();
  const { data: d } = await db.from('deliveries').select('*, customer:customers(delivery_term)').eq('id', params.id).single();
  if (!d) return bad('Không tìm thấy chuyến giao.', 404);
  if (d.status !== 'IN_TRANSIT') return bad('Chuyến giao này đã được xác nhận.', 409);
  if (!b.receiver_name?.trim()) return bad('Nhập tên người nhận.', 400, { fields: ['receiver_name'] });
  const outcome = b.outcome === 'REJECTED' ? 'REJECTED' : 'DELIVERED';
  const term = d.customer.delivery_term;
  if (outcome === 'DELIVERED') {
    const missing = REQUIRED[term].filter((k) => !b[k]);
    if (missing.length) return bad(`Điều kiện ${term === 'ON_TRUCK' ? '車上渡し' : '軒先渡し'} thiếu bằng chứng: ${missing.map((k) => LABEL[k]).join(', ')}. Chưa thể hoàn tất.`, 400, { fields: missing });
  }
  const { data: pod } = await db.from('pods').insert({ delivery_id: d.id, delivery_term: term, receiver_name: b.receiver_name.trim(),
    has_signature: !!b.has_signature, has_photo: !!b.has_photo, arrival_temp_c: b.arrival_temp_c === '' || b.arrival_temp_c == null ? null : Number(b.arrival_temp_c),
    note: b.note || null, recorded_by: user.id }).select().single();
  await db.from('deliveries').update({ status: outcome, delivered_at: new Date().toISOString() }).eq('id', d.id);
  await audit(user, `POD_${outcome}`, 'deliveries', d.id, d, { status: outcome, pod });
  return ok({ pod, status: outcome });
}
