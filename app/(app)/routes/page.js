'use client';
import Link from 'next/link';
import { useLoad } from '@/components/api';
import { PageHeader, Loading, LoadError, Band, Status } from '@/components/ui';
export default function RoutesList() {
  const { data, error, loading } = useLoad('/api/routes');
  return (<>
    <PageHeader title="Lập tuyến & giờ lái" note="Tuyến chỉ được publish khi không vi phạm giới hạn giờ lái xe tải từ 2024 (物流2024年問題)." />
    {loading && <Loading />}<LoadError error={error} />
    {data && <div className="card overflow-x-auto"><table className="tbl">
      <thead><tr><th>Tuyến</th><th>Ngày</th><th>Tài xế</th><th>Xe</th><th>Điểm dừng</th><th>Version</th><th>Kiểm tra gần nhất</th><th>Trạng thái</th></tr></thead>
      <tbody>{data.routes.map((r) => (<tr key={r.id}>
        <td><Link className="font-medium text-chilled underline" href={`/routes/${r.id}`}>{r.route_code}</Link></td><td>{r.route_date}</td><td>{r.driver_name}</td>
        <td><Band band={r.vehicle_band} showRange={false} /></td><td>{r.stops.length}</td><td>v{r.version}</td>
        <td>{!r.last_check ? <span className="text-slate-500">Chưa kiểm tra</span> : r.last_check.ok ? <span className="text-pass">Hợp lệ</span> : <span className="text-block">{r.last_check.violations.length} vi phạm</span>}</td>
        <td><Status value={r.status} /></td></tr>))}</tbody></table></div>}
  </>);
}
