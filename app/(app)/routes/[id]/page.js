'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, useLoad } from '@/components/api';
import { PageHeader, Loading, LoadError, Band, Status, Alert, Mock } from '@/components/ui';

export default function RouteDetail({ params }) {
  const { data, error, loading, reload } = useLoad(`/api/routes/${params.id}`);
  const master = useLoad('/api/master');
  const [stops, setStops] = useState([]); const [depot, setDepot] = useState(''); const [reason, setReason] = useState('');
  const [dirty, setDirty] = useState(false); const [msg, setMsg] = useState(null);
  useEffect(() => { if (data) { setStops(data.route.stops.map((s) => ({ ...s }))); setDepot(String(data.route.depot_start).slice(0, 5)); setDirty(false); } }, [data]);
  if (loading) return <Loading />; if (error) return <LoadError error={error} />;
  const { route, rule, result } = data;
  const edit = (i, k, v) => { setStops(stops.map((s, j) => (j === i ? { ...s, [k]: v } : s))); setDirty(true); };
  async function save() {
    setMsg(null);
    try { await api(`/api/routes/${route.id}`, { method: 'PUT', body: { stops, depot_start: depot, reason } }); setReason(''); setMsg({ ok: 'Đã lưu. Kết quả kiểm tra bên dưới đã cập nhật.' }); reload(); }
    catch (x) { setMsg({ err: x.message }); }
  }
  async function publish() {
    setMsg(null);
    try { await api(`/api/routes/${route.id}/publish`, { method: 'POST' }); setMsg({ ok: 'Đã publish tuyến. Tài xế nhận version này.' }); reload(); }
    catch (x) { setMsg({ err: x.message }); reload(); }
  }
  const viol = result.violations;
  return (<>
    <PageHeader title={`Tuyến ${route.route_code}`} note={`${route.route_date} · tài xế ${route.driver_name} · version ${route.version}${route.change_reason ? ` · lý do đổi gần nhất: ${route.change_reason}` : ''}`}>
      <Band band={route.vehicle_band} /><Status value={route.status} /><Link className="btn" href="/routes">Danh sách tuyến</Link></PageHeader>

    <section className={`card mb-5 p-4 ${viol.length ? 'border-red-300' : 'border-green-300'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={viol.length ? 'text-block' : 'text-pass'}>{viol.length ? `${viol.length} vi phạm giờ lái – không được publish` : 'Không vi phạm – có thể publish'}</h2>
          <p className="text-sm text-slate-600">Tổng lái {result.totals.drive_min} phút · ràng buộc {result.totals.restraint_min} phút · rule version {rule.version} (lái liên tục ≤ {rule.max_continuous_drive_min} phút, ràng buộc ≤ {rule.max_daily_restraint_min} phút/ngày)</p>
        </div>
        <button className="btn-primary" disabled={viol.length > 0 || dirty || route.status === 'PUBLISHED'} onClick={publish}>{route.status === 'PUBLISHED' ? 'Đã publish' : 'Publish tuyến'}</button>
      </div>
      {viol.map((v, i) => <div key={i} className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-block"><b>{v.message}</b><div>Gợi ý: {v.suggestion}</div></div>)}
      {dirty && <p className="mt-2 text-sm text-ambient">Có thay đổi chưa lưu – lưu để kiểm tra lại trước khi publish.</p>}
    </section>

    <section className="card">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <h2 className="text-base">Điểm dừng</h2>
        <label className="ml-auto flex items-center gap-2 text-sm">Xuất phát kho <input type="time" className="input w-28" value={depot} onChange={(e) => { setDepot(e.target.value); setDirty(true); }} /></label>
      </div>
      <div className="overflow-x-auto"><table className="tbl">
        <thead><tr><th>#</th><th>Khách hàng</th><th>Lái tới (phút)</th><th>Dỡ hàng (phút)</th><th>Nghỉ sau điểm (phút)</th><th>Đến – rời</th><th>Lái liên tục</th><th></th></tr></thead>
        <tbody>{stops.map((s, i) => { const tl = result.timeline[i]; const v = viol.find((x) => x.seq === i + 1);
          return (<tr key={i} className={v ? 'bg-red-50/50' : ''}><td>{i + 1}</td>
            <td><select className="input" aria-label="Khách hàng" value={s.customer_code || ''} onChange={(e) => edit(i, 'customer_code', e.target.value)}>
              <option value="">—</option>{master.data?.customers.map((c) => <option key={c.customer_code} value={c.customer_code}>{c.customer_code} · {c.name}</option>)}</select></td>
            {['drive_min', 'service_min', 'break_min'].map((k) => <td key={k}><input type="number" min="0" className="input w-24" aria-label={k} value={s[k]} onChange={(e) => edit(i, k, e.target.value)} /></td>)}
            <td className="whitespace-nowrap">{!dirty && tl ? `${tl.arrive} – ${tl.depart}` : '…'}</td>
            <td className={!dirty && tl && tl.continuous_after_drive > rule.max_continuous_drive_min ? 'font-semibold text-block' : ''}>{!dirty && tl ? `${tl.continuous_after_drive} phút` : '…'}</td>
            <td><button className="btn" onClick={() => { setStops(stops.filter((_, j) => j !== i)); setDirty(true); }}>Xóa</button></td></tr>); })}</tbody></table></div>
      <div className="space-y-3 p-4">
        <button className="btn" onClick={() => { setStops([...stops, { customer_code: '', drive_min: 30, service_min: 20, break_min: 0 }]); setDirty(true); }}>Thêm điểm dừng</button>
        {route.status === 'PUBLISHED' && <div><label className="label" htmlFor="reason">Lý do thay đổi (bắt buộc vì tuyến đã publish)</label><input id="reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)} /></div>}
        {msg?.ok && <Alert kind="ok">{msg.ok}</Alert>}{msg?.err && <Alert>{msg.err}</Alert>}
        <button className="btn-primary" disabled={!dirty} onClick={save}>Lưu & kiểm tra lại</button>
      </div>
    </section>
    <Mock>Thời gian lái giữa các điểm nhập tay; chỉ kiểm 2 giới hạn trong ngày. Làm thật: lấy thời gian từ map service có license và kiểm thêm giới hạn tuần/tháng/năm từ dữ liệu chấm công.</Mock>
  </>);
}
