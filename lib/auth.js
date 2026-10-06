import { NextResponse } from 'next/server';
import { supabaseServer, supabaseAdmin } from './supabase';

export async function getCurrentUser() {
  const { data: { user } } = await supabaseServer().auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabaseAdmin().from('profiles').select('*').eq('id', user.id).single();
  if (!profile || !profile.is_active) return null;
  return profile;
}

// Dùng ở đầu mỗi API route: trả về { user } hoặc { error: NextResponse }
export async function requireApi(roles) {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: 'Chưa đăng nhập hoặc tài khoản đã bị khóa.' }, { status: 401 }) };
  if (roles && user.role !== 'admin' && !roles.includes(user.role)) {
    return { error: NextResponse.json({ error: `Vai trò "${user.role}" không có quyền thực hiện thao tác này.` }, { status: 403 }) };
  }
  return { user };
}

export async function audit(user, action, entity, entityId, before, after, reason) {
  await supabaseAdmin().from('audit_logs').insert({
    actor_id: user?.id ?? null, actor_email: user?.email ?? null,
    action, entity, entity_id: entityId == null ? null : String(entityId),
    before: before ?? null, after: after ?? null, reason: reason ?? null,
  });
}

export const bad = (msg, status = 400, extra = {}) => NextResponse.json({ error: msg, ...extra }, { status });
export const ok = (data) => NextResponse.json(data);
