import { requireApi, ok, bad, audit } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
const ROLES = ['admin', 'receiving', 'warehouse', 'planner', 'qa', 'driver', 'sales'];
export async function GET() {
  const { error } = await requireApi([]); if (error) return error;
  const { data } = await supabaseAdmin().from('profiles').select('*').order('email');
  return ok({ users: data || [] });
}
export async function PATCH(req) {
  const { user, error } = await requireApi([]); if (error) return error;
  const { id, role, is_active } = await req.json();
  if (role && !ROLES.includes(role)) return bad('Vai trò không hợp lệ.');
  if (id === user.id && (is_active === false || (role && role !== 'admin'))) return bad('Không thể tự khóa hoặc tự hạ quyền tài khoản đang dùng.');
  const db = supabaseAdmin();
  const { data: before } = await db.from('profiles').select('*').eq('id', id).single();
  if (!before) return bad('Không tìm thấy người dùng.', 404);
  const patch = {}; if (role) patch.role = role; if (typeof is_active === 'boolean') patch.is_active = is_active;
  const { data: after } = await db.from('profiles').update(patch).eq('id', id).select().single();
  await audit(user, 'UPDATE_USER', 'profiles', id, before, after);
  return ok({ user: after });
}
