'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { api, useLoad } from '@/components/api';
import { PageHeader, Loading, LoadError, Band, Alert, Mock, EXPIRY } from '@/components/ui';
import { DEMO_DATE } from '@/lib/config';

const EMPTY = { sku_code: '', supplier_code: '', lot_code: '', manufactured_on: '', expiry_date: '', qty: '', measured_temp_c: '', location_code: '', beef_id: '', rice_origin: '', photo_taken: false };
const NAMES = { sku_code: 'SKU', supplier_code: 'Nhà cung cấp', lot_code: 'Mã lô', manufactured_on: 'Ngày sản xuất', expiry_date: 'Hạn in trên nhãn', qty: 'Số lượng', measured_temp_c: 'Nhiệt độ đo', location_code: 'Vị trí', beef_id: 'Mã cá thể bò', rice_origin: 'Xuất xứ gạo', photo_taken: 'Ảnh kiểm hàng' };

export default function Inbound() {
  const { data: m, error, loading } = useLoad('/api/master');
  const [f, setF] = useState(EMPTY); const [bad, setBad] = useState([]); const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false);
  const sku = useMemo(() => m?.skus.find((s) => s.sku_code === f.sku_code), [m, f.sku_code]);
  const band = useMemo(() => sku && m.bands.filter((b) => b.band === sku.band).sort((a, b) => b.version - a.version)[0], [m, sku]);
  const locs = useMemo(() => (m?.locations || []).filter((l) => !sku || l.band === sku.band), [m, sku]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const cls = (k) => `input ${bad.includes(k) ? 'input-error' : ''}`;
  const tOut = band && f.measured_temp_c !== '' && ((band.min_c !== null && Number(f.measured_temp_c) < Number(band.min_c)) || (band.max_c !== null && Number(f.measured_temp_c) > Number(band.max_c)));

  async function submit(e) {
    e.preventDefault(); setBusy(true); setMsg(null); setBad([]);
    try {
      const r = await api('/api/inbound', { method: 'POST', body: f });
      setMsg({ kind: r.quarantined ? 'warn' : 'ok', lot: r.lot, quarantined: r.quarantined });
      setF({ ...EMPTY, supplier_code: f.supplier_code });
    } catch (err) { setBad(err.data?.fields || []); setMsg({ kind: 'error', text: err.message, fields: err.data?.fields }); }
    setBusy(false);
  }
  if (loading) return <Loading />; if (error) return <LoadError error={error} />;
  return (<>
    <PageHeader title="Kiểm hàng nhập" note="Ghi từng dòng hàng nhập. Thiếu trường bắt buộc sẽ bị chặn; nhiệt độ ngoài dải của SKU sẽ đưa lô vào cách ly và tạo cảnh báo cho QA." />
    <form onSubmit={submit} className="card grid gap-4 p-5 md:grid-cols-3" noValidate>
      <div><label className="label" htmlFor="sku">SKU</label>
        <select id="sku" className={cls('sku_code')} value={f.sku_code} onChange={(e) => setF({ ...f, sku_code: e.target.value, location_code: '' })}>
          <option value="">Chọn SKU…</option>{m.skus.map((s) => <option key={s.sku_code} value={s.sku_code}>{s.sku_code} · {s.name}</option>)}</select>
        {sku && <div className="hint flex flex-wrap items-center gap-2"><Band band={sku.band} /> <span>Loại hạn: <b>{EXPIRY[sku.expiry_type]}</b></span></div>}</div>
      <div><label className="label" htmlFor="sup">Nhà cung cấp</label>
        <select id="sup" className={cls('supplier_code')} value={f.supplier_code} onChange={set('supplier_code')}>
          <option value="">Chọn…</option>{m.suppliers.map((s) => <option key={s.supplier_code} value={s.supplier_code}>{s.supplier_code} · {s.name}</option>)}</select></div>
      <div><label className="label" htmlFor="lot">Mã lô</label><input id="lot" className={cls('lot_code')} value={f.lot_code} onChange={set('lot_code')} placeholder="VD: L-CHI002-E" /></div>
      <div><label className="label" htmlFor="mfg">Ngày sản xuất</label><input id="mfg" type="date" className={cls('manufactured_on')} value={f.manufactured_on} onChange={set('manufactured_on')} max={DEMO_DATE} /></div>
      <div><label className="label" htmlFor="exp">Hạn in trên nhãn {sku && <span className="font-normal text-slate-500">({EXPIRY[sku.expiry_type]})</span>}</label>
        <input id="exp" type="date" className={cls('expiry_date')} value={f.expiry_date} onChange={set('expiry_date')} /></div>
      <div><label className="label" htmlFor="qty">Số lượng (thùng)</label><input id="qty" type="number" min="1" className={cls('qty')} value={f.qty} onChange={set('qty')} /></div>
      <div><label className="label" htmlFor="temp">Nhiệt độ đo (°C)</label><input id="temp" type="number" step="0.1" className={cls('measured_temp_c')} value={f.measured_temp_c} onChange={set('measured_temp_c')} />
        {band && <div className={`hint ${tOut ? 'font-medium text-block' : ''}`}>Ngưỡng v{band.version}: {band.min_c ?? '—'} đến {band.max_c ?? '—'}°C{tOut ? ' · ngoài dải → lô sẽ bị cách ly' : ''}</div>}</div>
      <div><label className="label" htmlFor="loc">Vị trí lưu</label>
        <select id="loc" className={cls('location_code')} value={f.location_code} onChange={set('location_code')}>
          <option value="">Chọn…</option>{locs.map((l) => <option key={l.location_code} value={l.location_code}>{l.location_code} · {l.band}</option>)}</select>
        <div className="hint">Chỉ hiện vị trí cùng dải nhiệt với SKU.</div></div>
      {sku?.trace_lane === 'BEEF' && <div><label className="label" htmlFor="beef">Mã cá thể bò (10 số)</label>
        <input id="beef" inputMode="numeric" maxLength={10} className={cls('beef_id')} value={f.beef_id} onChange={set('beef_id')} /><div className="hint">Bắt buộc theo luật truy xuất thịt bò.</div></div>}
      {sku?.trace_lane === 'RICE' && <div><label className="label" htmlFor="rice">Xuất xứ gạo</label>
        <input id="rice" className={cls('rice_origin')} value={f.rice_origin} onChange={set('rice_origin')} /><div className="hint">Bắt buộc theo luật truy xuất gạo.</div></div>}
      <div className="md:col-span-3">
        <label className={`inline-flex items-center gap-2 text-sm ${bad.includes('photo_taken') ? 'text-block' : ''}`}>
          <input type="checkbox" checked={f.photo_taken} onChange={set('photo_taken')} /> Đã chụp ảnh kiểm hàng</label>
        <Mock>Ảnh chỉ được đánh dấu là đã chụp. Làm thật: tải ảnh lên Supabase Storage kèm mã hash.</Mock>
      </div>
      <div className="md:col-span-3 space-y-3">
        {msg?.kind === 'error' && <Alert>{msg.text}{msg.fields?.length ? ` Trường cần sửa: ${msg.fields.map((k) => NAMES[k] || k).join(', ')}.` : ''}</Alert>}
        {msg?.kind === 'ok' && <Alert kind="ok">Đã nhận lô <Link className="underline" href={`/lots/${msg.lot.id}`}>{msg.lot.lot_code}</Link> vào kho, trạng thái khả dụng.</Alert>}
        {msg?.kind === 'warn' && <Alert kind="warn">Lô <Link className="underline" href={`/lots/${msg.lot.id}`}>{msg.lot.lot_code}</Link> đã vào CÁCH LY vì nhiệt độ ngoài dải. Cảnh báo đã gửi sang màn hình <Link className="underline" href="/deviations">Cảnh báo nhiệt độ</Link> để QA quyết định.</Alert>}
        <button className="btn-primary" disabled={busy}>{busy ? 'Đang ghi…' : 'Xác nhận dòng nhập'}</button>
      </div>
    </form>
  </>);
}
