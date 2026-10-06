'use client';
import { useState } from 'react';
import { api, useLoad } from '@/components/api';
import { PageHeader, Loading, LoadError, Band, Alert, Mock, EXPIRY, TERM } from '@/components/ui';
const RULES = [['', 'Chưa chốt (BUSINESS-REVIEW)'], ['ONE_THIRD', 'Quy tắc 1/3'], ['ONE_HALF', 'Quy tắc 1/2'], ['LABEL_DATE_ONLY', 'Chỉ cần còn hạn nhãn']];
export default function Master() {
  const { data, error, loading, reload } = useLoad('/api/master'); const [msg, setMsg] = useState(null);
  async function change(a, v) {
    setMsg(null);
    try { await api('/api/agreements', { method: 'PATCH', body: { id: a.id, window_rule: v || null } }); setMsg({ ok: `Đã cập nhật quy tắc cho ${a.customer_code} · ${a.sku_code}.` }); reload(); }
    catch (x) { setMsg({ err: x.message }); }
  }
  if (loading) return <Loading />; if (error) return <LoadError error={error} />;
  return (<>
    <PageHeader title="SKU & hợp đồng khách" note="Quy tắc 1/3, 1/2 là tập quán thương mại theo từng hợp đồng khách–SKU, không phải hạn dùng thực và không phải quy định pháp luật." />
    <section className="card mb-5 overflow-x-auto"><h2 className="border-b border-line px-4 py-3 text-base">SKU</h2>
      <table className="tbl"><thead><tr><th>Mã</th><th>Tên</th><th>Dải nhiệt</th><th>Loại hạn</th><th>Lane truy xuất</th></tr></thead>
        <tbody>{data.skus.map((s) => <tr key={s.sku_code}><td>{s.sku_code}</td><td>{s.name}</td><td><Band band={s.band} /></td><td>{EXPIRY[s.expiry_type]}</td><td>{s.trace_lane === 'INTERNAL' ? 'Lô nội bộ' : s.trace_lane === 'BEEF' ? 'Thịt bò (bắt buộc)' : 'Gạo (bắt buộc)'}</td></tr>)}</tbody></table></section>
    <section className="card mb-5 overflow-x-auto"><h2 className="border-b border-line px-4 py-3 text-base">Hợp đồng khách–SKU (delivery window)</h2>
      {msg?.ok && <div className="p-3"><Alert kind="ok">{msg.ok}</Alert></div>}{msg?.err && <div className="p-3"><Alert>{msg.err}</Alert></div>}
      <table className="tbl"><thead><tr><th>Khách</th><th>Điều kiện giao</th><th>SKU</th><th>Quy tắc</th><th>Ghi chú</th></tr></thead>
        <tbody>{data.agreements.map((a) => { const c = data.customers.find((x) => x.customer_code === a.customer_code); return (<tr key={a.id} className={a.window_rule ? '' : 'bg-amber-50/60'}>
          <td>{a.customer_code}<div className="text-xs text-slate-500">{c?.name}</div></td><td className="text-xs">{TERM[c?.delivery_term]}</td><td>{a.sku_code}</td>
          <td><select className="input" aria-label="Quy tắc delivery window" value={a.window_rule || ''} onChange={(e) => change(a, e.target.value)}>{RULES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></td>
          <td className="text-xs text-slate-600">{a.note}</td></tr>); })}</tbody></table></section>
    <section className="card overflow-x-auto"><h2 className="border-b border-line px-4 py-3 text-base">Ngưỡng 3 dải nhiệt (chính sách Yuki)</h2>
      <table className="tbl"><thead><tr><th>Dải</th><th>Version</th><th>Hiệu lực từ</th><th>Min</th><th>Max</th></tr></thead>
        <tbody>{data.bands.map((b) => <tr key={b.id}><td><Band band={b.band} showRange={false} /></td><td>v{b.version}</td><td>{b.effective_from}</td><td>{b.min_c ?? '—'}°C</td><td>{b.max_c ?? '—'}°C</td></tr>)}</tbody></table></section>
    <Mock>Sửa quy tắc có hiệu lực ngay và ghi audit; chưa có luồng đề xuất–duyệt (maker-checker) và hiệu lực theo ngày cho master.</Mock>
  </>);
}
