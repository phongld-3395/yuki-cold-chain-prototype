'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useLoad } from '@/components/api';
import { PageHeader, Loading, LoadError, Band, Status, EXPIRY } from '@/components/ui';

function LotsInner() {
  const sp = useSearchParams();
  const [fl, setFl] = useState({ status: sp.get('status') || '', band: '', expiry_type: '', q: '' });
  const qs = new URLSearchParams(Object.entries(fl).filter(([, v]) => v)).toString();
  const { data, error, loading } = useLoad('/api/lots' + (qs ? `?${qs}` : ''));
  const set = (k) => (e) => setFl({ ...fl, [k]: e.target.value });
  return (<>
    <PageHeader title="Tồn kho theo lô" note="Sắp xếp theo hạn gần nhất. Lô cách ly không được phân bổ cho đến khi QA release." />
    <div className="card mb-4 grid gap-3 p-4 md:grid-cols-4">
      <input className="input" placeholder="Tìm mã lô…" value={fl.q} onChange={set('q')} aria-label="Tìm mã lô" />
      <select className="input" value={fl.band} onChange={set('band')} aria-label="Dải nhiệt"><option value="">Mọi dải nhiệt</option><option value="AMBIENT">常温</option><option value="CHILLED">冷蔵</option><option value="FROZEN">冷凍</option></select>
      <select className="input" value={fl.status} onChange={set('status')} aria-label="Trạng thái"><option value="">Mọi trạng thái</option><option value="AVAILABLE">Khả dụng</option><option value="RELEASED">Đã release</option><option value="QUARANTINE">Cách ly</option><option value="SCRAPPED">Đã hủy</option></select>
      <select className="input" value={fl.expiry_type} onChange={set('expiry_type')} aria-label="Loại hạn"><option value="">Mọi loại hạn</option><option value="USE_BY">消費期限</option><option value="BEST_BEFORE">賞味期限</option></select>
    </div>
    {loading && <Loading />}<LoadError error={error} />
    {data && <div className="card overflow-x-auto"><table className="tbl">
      <thead><tr><th>Mã lô</th><th>SKU</th><th>Dải nhiệt</th><th>Hạn</th><th>Tồn / nhập</th><th>Vị trí</th><th>Trạng thái</th></tr></thead>
      <tbody>{data.lots.map((l) => (<tr key={l.id}>
        <td><Link className="font-medium text-chilled underline" href={`/lots/${l.id}`}>{l.lot_code}</Link></td>
        <td>{l.sku_code}<div className="text-xs text-slate-500">{l.sku?.name}</div></td>
        <td><Band band={l.sku?.band} /></td>
        <td>{l.expiry_date}<div className="text-xs text-slate-500">{EXPIRY[l.expiry_type]}</div></td>
        <td>{l.qty_available} / {l.qty_received}</td><td>{l.location_code}</td><td><Status value={l.status} /></td></tr>))}
        {data.lots.length === 0 && <tr><td colSpan={7} className="text-slate-500">Không có lô phù hợp bộ lọc.</td></tr>}</tbody></table></div>}
  </>);
}
export default function Lots() { return <Suspense fallback={<Loading />}><LotsInner /></Suspense>; }
