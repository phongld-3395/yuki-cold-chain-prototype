'use client';
import { useState } from 'react';
import { api, useLoad } from '@/components/api';
import { PageHeader, Loading, LoadError, Alert, Mock } from '@/components/ui';
import { ROLE_LABEL } from '@/lib/permissions';
export default function Users() {
  const { data, error, loading, reload } = useLoad('/api/users'); const [msg, setMsg] = useState(null);
  async function patch(u, body) { setMsg(null); try { await api('/api/users', { method: 'PATCH', body: { id: u.id, ...body } }); setMsg({ ok: `Đã cập nhật ${u.email}.` }); reload(); } catch (x) { setMsg({ err: x.message }); } }
  return (<>
    <PageHeader title="Người dùng & vai trò" note="Vai trò quyết định màn hình được thấy và thao tác được phép. Mọi thay đổi được ghi vào nhật ký thao tác." />
    {msg?.ok && <div className="mb-3"><Alert kind="ok">{msg.ok}</Alert></div>}{msg?.err && <div className="mb-3"><Alert>{msg.err}</Alert></div>}
    {loading && <Loading />}<LoadError error={error} />
    {data && <div className="card overflow-x-auto"><table className="tbl">
      <thead><tr><th>Email</th><th>Họ tên</th><th>Vai trò</th><th>Tình trạng</th><th></th></tr></thead>
      <tbody>{data.users.map((u) => (<tr key={u.id}><td>{u.email}</td><td>{u.full_name}</td>
        <td><select className="input" aria-label="Vai trò" value={u.role} onChange={(e) => patch(u, { role: e.target.value })}>{Object.entries(ROLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></td>
        <td>{u.is_active ? <span className="text-pass">Đang hoạt động</span> : <span className="text-block">Đã khóa</span>}</td>
        <td><button className="btn" onClick={() => patch(u, { is_active: !u.is_active })}>{u.is_active ? 'Khóa' : 'Mở khóa'}</button></td></tr>))}</tbody></table></div>}
    <Mock>Tài khoản mới được tạo trong Supabase Dashboard. Làm thật: mời người dùng qua email hoặc đồng bộ từ IdP doanh nghiệp (SSO).</Mock>
  </>);
}
