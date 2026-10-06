'use client';
import { useLoad } from '@/components/api';
import { PageHeader, Loading, LoadError, Mock } from '@/components/ui';
export default function Audit() {
  const { data, error, loading } = useLoad('/api/audit');
  return (<>
    <PageHeader title="Nhật ký thao tác" note="Ghi lại ai làm gì, lúc nào, dữ liệu trước/sau và lý do. Bảng nhật ký không cho sửa hoặc xóa." />
    {loading && <Loading />}<LoadError error={error} />
    {data && <div className="card overflow-x-auto"><table className="tbl">
      <thead><tr><th>Thời điểm (JST)</th><th>Người thực hiện</th><th>Thao tác</th><th>Đối tượng</th><th>Lý do</th><th>Chi tiết</th></tr></thead>
      <tbody>{data.logs.map((l) => (<tr key={l.id}><td className="whitespace-nowrap">{new Date(l.created_at).toLocaleString('vi-VN', { timeZone: 'Asia/Tokyo' })}</td>
        <td>{l.actor_email}</td><td className="font-medium">{l.action}</td><td>{l.entity} #{l.entity_id}</td><td>{l.reason}</td>
        <td><details><summary className="cursor-pointer text-chilled">Xem</summary><pre className="mt-1 max-w-md overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify({ before: l.before, after: l.after }, null, 1)}</pre></details></td></tr>))}
        {data.logs.length === 0 && <tr><td colSpan={6} className="text-slate-500">Chưa có thao tác nào.</td></tr>}</tbody></table></div>}
    <Mock>Chưa có xuất gói bằng chứng kiểm toán. Làm thật: export kèm manifest SHA-256 tái tạo được.</Mock>
  </>);
}
