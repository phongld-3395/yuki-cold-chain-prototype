'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/components/api';
import { PageHeader, Alert, Band, Status } from '@/components/ui';
export default function Trace() {
  const [q, setQ] = useState(''); const [data, setData] = useState(null); const [err, setErr] = useState(''); const [ms, setMs] = useState(null);
  async function search(e) { e.preventDefault(); setErr(''); const t = performance.now();
    try { setData(await api(`/api/trace?q=${encodeURIComponent(q)}`)); setMs(Math.round(performance.now() - t)); } catch (x) { setErr(x.message); setData(null); } }
  return (<>
    <PageHeader title="Truy xuất nguồn gốc" note="Luật chỉ bắt buộc truy xuất với gạo và thịt bò; các SKU khác truy xuất theo mã lô nội bộ." />
    <form onSubmit={search} className="card mb-4 flex flex-wrap gap-3 p-4">
      <input className="input flex-1" placeholder="Mã lô (L-CHI003-A), mã cá thể bò 10 số (1234567890) hoặc xuất xứ gạo (Niigata)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Từ khóa truy xuất" />
      <button className="btn-primary">Truy xuất</button></form>
    {err && <Alert>{err}</Alert>}
    {data && <p className="mb-3 text-sm text-slate-600">{data.results.length} lô khớp · {data.mode === 'BEEF' ? 'tìm theo mã cá thể bò' : 'tìm theo mã lô / xuất xứ gạo'} · {ms} ms</p>}
    {data?.results.map(({ lot, allocations, deliveries }) => (<section key={lot.id} className="card mb-4 p-4">
      <div className="flex flex-wrap items-center gap-3"><Link className="text-lg font-semibold text-chilled underline" href={`/lots/${lot.id}`}>{lot.lot_code}</Link><Band band={lot.sku.band} /><Status value={lot.status} /></div>
      <ol className="mt-3 space-y-2 border-l-2 border-line pl-4 text-sm">
        <li><b>Nhập kho</b> {new Date(lot.received_at).toLocaleString('vi-VN', { timeZone: 'Asia/Tokyo' })} · NCC {lot.supplier?.name} · {lot.sku_code} {lot.sku.name}
          {lot.beef_id && <> · mã bò <b>{lot.beef_id}</b></>}{lot.rice_origin && <> · gạo xuất xứ <b>{lot.rice_origin}</b></>}</li>
        <li><b>Tồn hiện tại</b> {lot.qty_available}/{lot.qty_received} tại {lot.location_code}</li>
        {allocations.map((a, i) => <li key={i}><b>Phân bổ</b> {a.line?.order?.order_no} cho {a.line?.order?.customer_code} × {a.qty}</li>)}
        {deliveries.map((d) => <li key={d.id}><b>Giao</b> {d.customer_code} {d.customer?.name} × {d.qty} · <Status value={d.status} /></li>)}
        {!allocations.length && !deliveries.length && <li className="text-slate-500">Dữ liệu dừng ở kho: chưa phân bổ, chưa giao.</li>}
      </ol></section>))}
  </>);
}
