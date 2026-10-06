'use client';
import { useState } from 'react';
import { api, useLoad } from '@/components/api';
import { PageHeader, Loading, LoadError, Alert, Mock, TERM } from '@/components/ui';

function PodForm({ d, onDone }) {
  const [f, setF] = useState({ receiver_name: '', has_signature: false, has_photo: false, arrival_temp_c: '', note: '', outcome: 'DELIVERED' });
  const [err, setErr] = useState(''); const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const needPhoto = d.customer.delivery_term === 'DOORSTEP';
  async function submit(e) { e.preventDefault(); setErr(''); try { await api(`/api/deliveries/${d.id}/pod`, { method: 'POST', body: f }); onDone(); } catch (x) { setErr(x.message); } }
  return (<form onSubmit={submit} className="mt-3 grid gap-3 rounded-md bg-mist p-3 md:grid-cols-2">
    <div><label className="label" htmlFor={`r${d.id}`}>Tên người nhận</label><input id={`r${d.id}`} className="input" value={f.receiver_name} onChange={set('receiver_name')} /></div>
    <div><label className="label" htmlFor={`t${d.id}`}>Nhiệt độ hàng khi đến (°C, nếu đo)</label><input id={`t${d.id}`} type="number" step="0.1" className="input" value={f.arrival_temp_c} onChange={set('arrival_temp_c')} /></div>
    <div className="space-y-1 text-sm md:col-span-2">
      <label className="flex items-center gap-2"><input type="checkbox" checked={f.has_signature} onChange={set('has_signature')} /> Đã có chữ ký người nhận <span className="text-xs text-slate-500">(bắt buộc)</span></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={f.has_photo} onChange={set('has_photo')} /> Đã chụp ảnh hàng tại điểm giao {needPhoto ? <span className="text-xs text-slate-500">(bắt buộc với 軒先渡し)</span> : <span className="text-xs text-slate-500">(tùy chọn với 車上渡し)</span>}</label>
    </div>
    <div className="md:col-span-2 flex flex-wrap gap-4 text-sm">
      <label className="flex items-center gap-1.5"><input type="radio" checked={f.outcome === 'DELIVERED'} onChange={() => setF({ ...f, outcome: 'DELIVERED' })} /> Khách đã nhận</label>
      <label className="flex items-center gap-1.5"><input type="radio" checked={f.outcome === 'REJECTED'} onChange={() => setF({ ...f, outcome: 'REJECTED' })} /> Khách từ chối nhận</label>
    </div>
    {err && <div className="md:col-span-2"><Alert>{err}</Alert></div>}
    <div className="md:col-span-2"><button className="btn-primary">Hoàn tất xác nhận giao</button></div>
  </form>);
}

export default function Pod() {
  const { data, error, loading, reload } = useLoad('/api/deliveries?status=IN_TRANSIT');
  const [open, setOpen] = useState(null); const [done, setDone] = useState('');
  return (<>
    <PageHeader title="Xác nhận giao (POD)" note="Bằng chứng bắt buộc phụ thuộc điều kiện giao trong hợp đồng: 車上渡し cần chữ ký; 軒先渡し cần chữ ký và ảnh. Lần giao đã nhận trở thành mốc so sánh 日付逆転 cho lần sau." />
    {done && <div className="mb-3"><Alert kind="ok">{done}</Alert></div>}
    {loading && <Loading />}<LoadError error={error} />
    {data && <div className="space-y-3">{data.deliveries.map((d) => (<div key={d.id} className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><b>{d.customer_code}</b> · {d.customer.name}<div className="text-sm text-slate-600">{d.sku_code} · {d.sku.name} · lô {d.lot?.lot_code} (hạn {d.expiry_date}) × {d.qty}</div></div>
        <div className="text-sm">{TERM[d.customer.delivery_term]}</div></div>
      {open === d.id ? <PodForm d={d} onDone={() => { setOpen(null); setDone(`Đã ghi nhận POD cho ${d.customer_code} · ${d.sku_code}.`); reload(); }} />
        : <button className="btn mt-3" onClick={() => setOpen(d.id)}>Ghi nhận giao</button>}
    </div>))}
      {data.deliveries.length === 0 && <p className="text-sm text-slate-500">Không có chuyến đang giao. Xuất hàng ở màn hình Xuất hàng trước.</p>}</div>}
    <Mock>Ảnh và chữ ký chỉ là ô đánh dấu; không có hàng đợi offline. Làm thật: thiết bị tài xế có MDM, lưu ảnh kèm hash, hàng đợi offline mã hóa tối đa 8 giờ.</Mock>
  </>);
}
