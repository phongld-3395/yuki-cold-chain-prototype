'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api, useLoad } from '@/components/api';
import { PageHeader, Loading, LoadError, Band, Status, Alert, Mock } from '@/components/ui';

function Review({ dev, onDone }) {
  const [decision, setDecision] = useState('RELEASE'); const [rationale, setRationale] = useState(''); const [err, setErr] = useState('');
  async function submit(e) {
    e.preventDefault(); setErr('');
    try { await api(`/api/deviations/${dev.id}/review`, { method: 'POST', body: { decision, rationale } }); onDone(); }
    catch (x) { setErr(x.message); }
  }
  return (<form onSubmit={submit} className="mt-3 space-y-2 rounded-md bg-mist p-3">
    <div className="flex gap-4 text-sm">
      <label className="inline-flex items-center gap-1.5"><input type="radio" checked={decision === 'RELEASE'} onChange={() => setDecision('RELEASE')} /> Release (cho phép dùng)</label>
      <label className="inline-flex items-center gap-1.5"><input type="radio" checked={decision === 'SCRAP'} onChange={() => setDecision('SCRAP')} /> Scrap (hủy lô)</label></div>
    <textarea className="input" rows={2} placeholder="Lý do quyết định – bắt buộc (vd: kiểm tra lại 3 mẫu đạt 4.1°C, thời gian vượt ngưỡng < 10 phút)" value={rationale} onChange={(e) => setRationale(e.target.value)} />
    {err && <Alert>{err}</Alert>}
    <button className={decision === 'SCRAP' ? 'btn-danger' : 'btn-primary'}>{decision === 'SCRAP' ? 'Xác nhận hủy lô' : 'Xác nhận release'}</button>
  </form>);
}
function waited(d) { const m = Math.round((Date.now() - new Date(d.detected_at)) / 60000); return m; }

export default function Deviations() {
  const { data, error, loading, reload } = useLoad('/api/deviations');
  const [open, setOpen] = useState(null);
  return (<>
    <PageHeader title="Cảnh báo nhiệt độ" note="Mỗi sai lệch phải được QA review. Lô liên quan giữ trạng thái cách ly cho đến khi có quyết định kèm lý do." />
    {loading && <Loading />}<LoadError error={error} />
    {data && <div className="space-y-3">
      {data.deviations.map((d) => (<div key={d.id} className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <Status value={d.status} /><Band band={d.band} />
            <span className="text-lg font-semibold text-block">{d.measured_c}°C</span>
            <span className="text-sm text-slate-600">ngưỡng {d.band_min_c ?? '—'} đến {d.band_max_c ?? '—'}°C</span>
          </div>
          <div className="text-sm">Lô <Link className="text-chilled underline" href={`/lots/${d.lot?.id}`}>{d.lot?.lot_code}</Link> · {d.lot?.sku_code} · <Status value={d.lot?.status} /></div>
        </div>
        <div className="mt-2 text-sm text-slate-600">Phát hiện {new Date(d.detected_at).toLocaleString('vi-VN', { timeZone: 'Asia/Tokyo' })} (JST)
          {d.status === 'OPEN' && <span className={waited(d) > 15 ? ' font-medium text-block' : ''}> · đã chờ {waited(d)} phút (SLA review 15 phút)</span>}</div>
        {d.status !== 'OPEN' && <p className="mt-2 text-sm"><b>{d.decision}</b>: {d.rationale}</p>}
        {d.status === 'OPEN' && (open === d.id ? <Review dev={d} onDone={() => { setOpen(null); reload(); }} />
          : <button className="btn mt-3" onClick={() => setOpen(d.id)}>Review sai lệch</button>)}
      </div>))}
      {data.deviations.length === 0 && <p className="text-sm text-slate-500">Không có cảnh báo.</p>}
      <Mock>Không gửi email khi có cảnh báo mới. Làm thật: gửi qua mail relay doanh nghiệp và nhắc lại khi quá 15 phút.</Mock>
    </div>}
  </>);
}
