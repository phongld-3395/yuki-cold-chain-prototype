'use client';
import { useState } from 'react';
import { api, useLoad } from '@/components/api';
import { PageHeader, Loading, LoadError, Band, Alert, Mock } from '@/components/ui';
export default function Shipments() {
  const { data, error, loading, reload } = useLoad('/api/shipments');
  const [route, setRoute] = useState({}); const [msg, setMsg] = useState(null);
  async function ship(line) {
    setMsg(null);
    try { await api('/api/shipments', { method: 'POST', body: { line_id: line.id, route_id: route[line.id] || null } }); setMsg({ ok: `Đã xuất ${line.order.order_no} · ${line.sku_code}. Chuyến giao chuyển sang màn hình POD.` }); reload(); }
    catch (x) { setMsg({ err: x.message }); }
  }
  return (<>
    <PageHeader title="Xuất hàng" note="Xác nhận xuất các dòng đã phân bổ. Mỗi lô xuất tạo một chuyến giao ở trạng thái đang giao." />
    {msg?.ok && <div className="mb-3"><Alert kind="ok">{msg.ok}</Alert></div>}{msg?.err && <div className="mb-3"><Alert>{msg.err}</Alert></div>}
    {loading && <Loading />}<LoadError error={error} />
    {data && <div className="card overflow-x-auto"><table className="tbl">
      <thead><tr><th>Đơn</th><th>Khách</th><th>SKU</th><th>Lô đã phân bổ</th><th>Tuyến</th><th></th></tr></thead>
      <tbody>{data.lines.map((l) => (<tr key={l.id}>
        <td>{l.order.order_no}<div className="text-xs text-slate-500">giao {l.order.requested_date}</div></td><td>{l.order.customer_code}</td>
        <td>{l.sku_code} <Band band={l.sku.band} showRange={false} /></td>
        <td>{l.allocations.map((a, i) => <div key={i}>{a.lot.lot_code} (hạn {a.lot.expiry_date}) × {a.qty}</div>)}</td>
        <td><select className="input" aria-label="Tuyến" value={route[l.id] || ''} onChange={(e) => setRoute({ ...route, [l.id]: e.target.value })}>
          <option value="">Chưa gán</option>{data.routes.filter((r) => r.vehicle_band === l.sku.band).map((r) => <option key={r.id} value={r.id}>{r.route_code}</option>)}</select></td>
        <td><button className="btn-primary" onClick={() => ship(l)}>Xác nhận xuất</button></td></tr>))}
        {data.lines.length === 0 && <tr><td colSpan={6} className="text-slate-500">Chưa có dòng nào đã phân bổ. Phân bổ ở màn hình Đơn hàng trước.</td></tr>}</tbody></table></div>}
    <Mock>Không quét mã vạch lô/seal và không ghi nhiệt độ xe trước khi xuất. Làm thật: máy quét Bluetooth, chặn khi sai lô hoặc sai dải nhiệt.</Mock>
  </>);
}
