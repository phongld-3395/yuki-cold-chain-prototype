'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api, useLoad } from '@/components/api';
import { PageHeader, Loading, LoadError, Status, Alert, Band, EXPIRY } from '@/components/ui';

const RULE = { ONE_THIRD: 'Quy tắc 1/3', ONE_HALF: 'Quy tắc 1/2', LABEL_DATE_ONLY: 'Chỉ cần còn hạn nhãn' };
const COLS = ['use_by', 'band', 'status', 'window', 'date_reversal'];
const COLNAME = { use_by: '消費期限', band: 'Dải nhiệt', status: 'Trạng thái', window: 'Delivery window', date_reversal: '日付逆転' };

function Line({ item, orderId, onDone }) {
  const { line, result, allocations } = item;
  const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false);
  async function allocate() {
    setBusy(true); setMsg(null);
    try { await api(`/api/orders/${orderId}/allocate`, { method: 'POST', body: { line_id: line.id } }); onDone(); }
    catch (x) { setMsg(x.message); } setBusy(false);
  }
  return (<section className="card mb-5">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
      <div className="flex flex-wrap items-center gap-2"><h2 className="text-base">{line.sku_code} · {line.sku.name}</h2><Band band={line.sku.band} />
        <span className="text-sm text-slate-600">{EXPIRY[line.sku.expiry_type]} · cần {line.qty} thùng</span></div><Status value={line.status} />
    </div>
    {allocations && <div className="p-4 text-sm">Đã phân bổ: {allocations.map((a) => `${a.lot.lot_code} (hạn ${a.lot.expiry_date}) × ${a.qty}`).join(', ')}</div>}
    {result && <div className="p-4">
      <div className="mb-3 grid gap-2 text-sm md:grid-cols-2">
        <div>Hợp đồng khách–SKU: {result.businessReview ? <b className="text-block">BUSINESS-REVIEW – chưa chốt quy tắc</b> : <b>{RULE[result.rule]}</b>}</div>
        <div>Lần giao đã nhận gần nhất: {result.lastDelivered ? <b>hạn {result.lastDelivered.expiry_date}</b> : <span className="text-slate-500">chưa có (không mượn lịch sử khách khác)</span>}</div>
      </div>
      <div className="overflow-x-auto"><table className="tbl">
        <thead><tr><th>Lô</th><th>Hạn</th>{COLS.map((c) => <th key={c}>{COLNAME[c]}</th>)}<th>Kết luận</th></tr></thead>
        <tbody>{result.rows.map((r) => (<tr key={r.lot.id} className={r.eligible ? '' : 'bg-red-50/40'}>
          <td className="font-medium">{r.lot.lot_code}</td><td>{r.lot.expiry_date}</td>
          {COLS.map((c) => { const ck = r.checks.find((x) => x.key === c); return (<td key={c} title={ck.detail}>
            <span className={ck.ok ? 'text-pass' : 'font-semibold text-block'}>{ck.ok ? '✓' : '✕'}</span>
            {!ck.ok && <div className="text-xs text-block">{ck.detail}</div>}</td>); })}
          <td>{r.eligible ? (result.plan.find((p) => p.lot_id === r.lot.id) ? <b className="text-pass">Chọn × {result.plan.find((p) => p.lot_id === r.lot.id).qty}</b> : <span className="text-slate-500">Hợp lệ, chưa cần</span>) : <span className="text-block">Loại</span>}</td>
        </tr>))}</tbody></table></div>
      <p className="mt-2 text-xs text-slate-500">Thứ tự kiểm tra: 消費期限 → dải nhiệt → trạng thái → delivery window theo hợp đồng → 日付逆転 so với lần giao gần nhất của đúng khách–SKU. Lô hợp lệ xếp hạn gần trước (FEFO), cùng hạn thì nhập trước (FIFO).</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {result.shortage > 0 ? <Alert>Thiếu {result.shortage} thùng lô hợp lệ. Không phân bổ một phần.</Alert>
          : <button className="btn-primary" disabled={busy} onClick={allocate}>{busy ? 'Đang phân bổ…' : `Phân bổ ${result.plan.map((p) => p.lot_code).join(', ')}`}</button>}
        {msg && <Alert>{msg}</Alert>}
      </div>
    </div>}
  </section>);
}

export default function OrderDetail({ params }) {
  const { data, error, loading, reload } = useLoad(`/api/orders/${params.id}/evaluate`);
  if (loading) return <Loading />; if (error) return <LoadError error={error} />;
  const { order, lines } = data;
  return (<>
    <PageHeader title={`Đơn ${order.order_no}`} note={`${order.customer_code} · ${order.customer.name} · giao ngày ${order.requested_date}`}>
      <Status value={order.status} /><Link className="btn" href="/orders">Danh sách đơn</Link></PageHeader>
    {lines.map((it) => <Line key={it.line.id} item={it} orderId={order.id} onDone={reload} />)}
  </>);
}
