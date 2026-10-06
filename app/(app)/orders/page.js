'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api, useLoad } from '@/components/api';
import { PageHeader, Loading, LoadError, Status, Alert, Mock } from '@/components/ui';
import { DEMO_DATE } from '@/lib/config';

function NewOrder({ master, onDone }) {
  const [f, setF] = useState({ customer_code: '', requested_date: DEMO_DATE, lines: [{ sku_code: '', qty: '' }] });
  const [err, setErr] = useState('');
  const setLine = (i, k, v) => setF({ ...f, lines: f.lines.map((l, j) => (j === i ? { ...l, [k]: v } : l)) });
  async function submit(e) { e.preventDefault(); setErr(''); try { await api('/api/orders', { method: 'POST', body: f }); onDone(); } catch (x) { setErr(x.message); } }
  return (<form onSubmit={submit} className="card mb-5 space-y-3 p-4">
    <div className="grid gap-3 md:grid-cols-2">
      <div><label className="label" htmlFor="cus">Khách hàng</label><select id="cus" className="input" value={f.customer_code} onChange={(e) => setF({ ...f, customer_code: e.target.value })}>
        <option value="">Chọn…</option>{master.customers.map((c) => <option key={c.customer_code} value={c.customer_code}>{c.customer_code} · {c.name}</option>)}</select></div>
      <div><label className="label" htmlFor="rd">Ngày giao dự kiến</label><input id="rd" type="date" className="input" value={f.requested_date} onChange={(e) => setF({ ...f, requested_date: e.target.value })} /></div>
    </div>
    {f.lines.map((l, i) => (<div key={i} className="grid grid-cols-[1fr_8rem] gap-3">
      <select className="input" aria-label="SKU" value={l.sku_code} onChange={(e) => setLine(i, 'sku_code', e.target.value)}><option value="">Chọn SKU…</option>{master.skus.map((s) => <option key={s.sku_code} value={s.sku_code}>{s.sku_code} · {s.name}</option>)}</select>
      <input className="input" aria-label="Số lượng" type="number" min="1" placeholder="SL" value={l.qty} onChange={(e) => setLine(i, 'qty', e.target.value)} /></div>))}
    <div className="flex gap-2"><button type="button" className="btn" onClick={() => setF({ ...f, lines: [...f.lines, { sku_code: '', qty: '' }] })}>Thêm dòng</button><button className="btn-primary">Tạo đơn hàng</button></div>
    {err && <Alert>{err}</Alert>}
  </form>);
}

export default function Orders() {
  const { data, error, loading, reload } = useLoad('/api/orders');
  const master = useLoad('/api/master');
  const [creating, setCreating] = useState(false);
  return (<>
    <PageHeader title="Đơn hàng & phân bổ" note="Mở một đơn để xem từng lô được đánh giá thế nào trước khi phân bổ.">
      <button className="btn-primary" onClick={() => setCreating(!creating)}>{creating ? 'Đóng' : 'Tạo đơn mới'}</button></PageHeader>
    {creating && master.data && <NewOrder master={master.data} onDone={() => { setCreating(false); reload(); }} />}
    {loading && <Loading />}<LoadError error={error} />
    {data && <div className="card overflow-x-auto"><table className="tbl">
      <thead><tr><th>Đơn</th><th>Khách hàng</th><th>Ngày giao</th><th>Dòng hàng</th><th>Trạng thái</th></tr></thead>
      <tbody>{data.orders.map((o) => (<tr key={o.id}>
        <td><Link className="font-medium text-chilled underline" href={`/orders/${o.id}`}>{o.order_no}</Link></td>
        <td>{o.customer_code}<div className="text-xs text-slate-500">{o.customer?.name}</div></td><td>{o.requested_date}</td>
        <td>{o.lines.map((l) => <div key={l.id}>{l.sku_code} × {l.qty} <Status value={l.status} /></div>)}</td><td><Status value={o.status} /></td></tr>))}</tbody></table></div>}
    <Mock>Đơn hàng tạo tay trên màn hình. Làm thật: nhận đơn từ ERP qua file CSV/SFTP.</Mock>
  </>);
}
