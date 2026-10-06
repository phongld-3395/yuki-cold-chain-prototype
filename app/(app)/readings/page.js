'use client';
import { useLoad } from '@/components/api';
import { PageHeader, Loading, LoadError, Band, Mock } from '@/components/ui';
export default function Readings() {
  const { data, error, loading } = useLoad('/api/readings');
  return (<>
    <PageHeader title="Nhật ký logger nhiệt độ" note="Mỗi điểm đo được so với ngưỡng đang hiệu lực (theo version) của dải nhiệt tại vị trí đặt logger." />
    {loading && <Loading />}<LoadError error={error} />
    {data && <div className="card overflow-x-auto"><table className="tbl">
      <thead><tr><th>Thời điểm (JST)</th><th>Logger</th><th>Vị trí</th><th>Dải nhiệt</th><th>Nhiệt độ</th><th>Đánh giá</th></tr></thead>
      <tbody>{data.readings.map((r) => (<tr key={r.id}>
        <td>{new Date(r.recorded_at).toLocaleString('vi-VN', { timeZone: 'Asia/Tokyo' })}</td><td>{r.device_id}</td><td>{r.location_code}</td>
        <td><Band band={r.band} /></td><td className={r.out ? 'font-semibold text-block' : ''}>{r.temp_c}°C</td>
        <td>{r.out ? <span className="text-block">Ngoài ngưỡng v{r.band_version} ({r.min_c ?? '—'} đến {r.max_c ?? '—'}°C)</span> : <span className="text-pass">Trong ngưỡng</span>}</td></tr>))}</tbody></table></div>}
    <Mock>Dữ liệu logger được đổ sẵn vào database thay cho import file CSV. Làm thật: import CSV từ logger, chống trùng bằng hash file, báo lỗi theo số dòng.</Mock>
  </>);
}
