'use client';
import Link from 'next/link';
import { useLoad } from '@/components/api';
import { PageHeader, Loading, LoadError, Band, Status, EXPIRY } from '@/components/ui';

export default function LotDetail({ params }) {
  const { data, error, loading } = useLoad(`/api/lots/${params.id}`);
  if (loading) return <Loading />; if (error) return <LoadError error={error} />;
  const { lot, allocations, deliveries, deviations } = data;
  const rows = [['SKU', `${lot.sku_code} · ${lot.sku.name}`], ['Dải nhiệt', <Band key="b" band={lot.sku.band} />], ['Loại hạn', EXPIRY[lot.expiry_type]],
    ['Ngày sản xuất', lot.manufactured_on], ['Hạn in trên nhãn', lot.expiry_date], ['Nhà cung cấp', lot.supplier?.name], ['Vị trí', lot.location_code],
    ['Nhiệt độ khi nhập', `${lot.measured_temp_c}°C`], ['Tồn / nhập', `${lot.qty_available} / ${lot.qty_received}`],
    ...(lot.beef_id ? [['Mã cá thể bò', lot.beef_id]] : []), ...(lot.rice_origin ? [['Xuất xứ gạo', lot.rice_origin]] : [])];
  return (<>
    <PageHeader title={`Lô ${lot.lot_code}`}><Status value={lot.status} /></PageHeader>
    <div className="grid gap-4 md:grid-cols-3">
      <dl className="card p-4 text-sm md:col-span-1">{rows.map(([k, v]) => (<div key={k} className="flex justify-between gap-3 border-b border-line py-1.5 last:border-0"><dt className="text-slate-500">{k}</dt><dd className="text-right">{v}</dd></div>))}</dl>
      <div className="space-y-4 md:col-span-2">
        <section className="card"><h2 className="border-b border-line px-4 py-2 text-base">Phân bổ</h2>
          {allocations.length ? <table className="tbl"><tbody>{allocations.map((a) => (<tr key={a.id}><td>{a.line?.order?.order_no}</td><td>{a.line?.order?.customer_code}</td><td>{a.qty} thùng</td></tr>))}</tbody></table> : <p className="p-4 text-sm text-slate-500">Chưa phân bổ.</p>}</section>
        <section className="card"><h2 className="border-b border-line px-4 py-2 text-base">Giao hàng</h2>
          {deliveries.length ? <table className="tbl"><tbody>{deliveries.map((d) => (<tr key={d.id}><td>{d.customer_code}</td><td>{d.qty} thùng</td><td><Status value={d.status} /></td></tr>))}</tbody></table> : <p className="p-4 text-sm text-slate-500">Chưa giao.</p>}</section>
        <section className="card"><h2 className="border-b border-line px-4 py-2 text-base">Sai lệch nhiệt độ</h2>
          {deviations.length ? <table className="tbl"><tbody>{deviations.map((d) => (<tr key={d.id}><td className="text-block">{d.measured_c}°C</td><td><Status value={d.status} /></td><td>{d.decision ? `${d.decision}: ${d.rationale}` : <Link className="underline" href="/deviations">Chờ QA</Link>}</td></tr>))}</tbody></table> : <p className="p-4 text-sm text-slate-500">Không có.</p>}</section>
      </div>
    </div>
  </>);
}
