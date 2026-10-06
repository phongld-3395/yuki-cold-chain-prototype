'use client';
import Link from 'next/link';
import { useLoad } from '@/components/api';
import { PageHeader, Loading, LoadError, Band } from '@/components/ui';

const TILES = [
  ['quarantine', 'Lô đang cách ly', '/lots?status=QUARANTINE'],
  ['openDev', 'Cảnh báo nhiệt độ chờ QA', '/deviations'],
  ['openLines', 'Dòng đơn chưa phân bổ', '/orders'],
  ['draftRoutes', 'Tuyến chưa publish', '/routes'],
  ['inTransit', 'Chuyến đang giao', '/pod'],
];
export default function Dashboard() {
  const { data, error, loading } = useLoad('/api/dashboard');
  return (<>
    <PageHeader title="Bảng điều khiển" note="Việc cần xử lý trong ngày, lấy trực tiếp từ cơ sở dữ liệu." />
    {loading && <Loading />}<LoadError error={error} />
    {data && <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {TILES.map(([k, label, href]) => (
          <Link key={k} href={href} className="card p-4 hover:border-chilled">
            <div className={`text-3xl font-semibold ${data[k] > 0 && (k === 'quarantine' || k === 'openDev') ? 'text-block' : ''}`}>{data[k]}</div>
            <div className="mt-1 text-sm text-slate-600">{label}</div>
          </Link>))}
      </div>
      <section className="card mt-6">
        <h2 className="border-b border-line px-4 py-3">Cảnh báo nhiệt độ gần nhất</h2>
        {data.recentDev.length === 0 ? <p className="p-4 text-sm text-slate-500">Không có cảnh báo.</p> :
          <table className="tbl"><thead><tr><th>Lô</th><th>Dải nhiệt</th><th>Nhiệt độ đo</th><th>Phát hiện</th><th>Trạng thái</th></tr></thead>
            <tbody>{data.recentDev.map((d) => (<tr key={d.id}>
              <td><Link className="text-chilled underline" href={`/lots/${d.lot?.id}`}>{d.lot?.lot_code}</Link> <span className="text-slate-500">{d.lot?.sku_code}</span></td>
              <td><Band band={d.band} /></td><td className="font-medium text-block">{d.measured_c}°C</td>
              <td>{new Date(d.detected_at).toLocaleString('vi-VN', { timeZone: 'Asia/Tokyo' })}</td>
              <td>{d.status === 'OPEN' ? <Link href="/deviations" className="text-block underline">Chờ QA review</Link> : 'Đã xử lý'}</td></tr>))}</tbody></table>}
      </section>
    </>}
  </>);
}
