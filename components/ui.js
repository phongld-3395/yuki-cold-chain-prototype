'use client';
// Mã màu theo dải nhiệt là "ngôn ngữ thị giác" xuyên suốt app
const BAND = {
  AMBIENT: { jp: '常温', range: '15–25°C', cls: 'bg-amber-50 text-ambient border-amber-200' },
  CHILLED: { jp: '冷蔵', range: '0–5°C', cls: 'bg-cyan-50 text-chilled border-cyan-200' },
  FROZEN: { jp: '冷凍', range: '≤ −18°C', cls: 'bg-indigo-50 text-frozen border-indigo-200' },
};
export function Band({ band, showRange = true }) {
  const b = BAND[band]; if (!b) return <span>{band || '—'}</span>;
  return (<span className={`inline-flex items-baseline gap-1 rounded border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ${b.cls}`}>
    {b.jp}{showRange && <span className="opacity-75">{b.range}</span>}</span>);
}
const STATUS = {
  AVAILABLE: ['Khả dụng', 'bg-green-50 text-pass border-green-200'], RELEASED: ['Đã release', 'bg-green-50 text-pass border-green-200'],
  QUARANTINE: ['Cách ly', 'bg-red-50 text-block border-red-200'], SCRAPPED: ['Đã hủy', 'bg-slate-100 text-slate-600 border-slate-200'],
  OPEN: ['Mở', 'bg-amber-50 text-ambient border-amber-200'], CLOSED: ['Đã xử lý', 'bg-slate-100 text-slate-600 border-slate-200'],
  ALLOCATED: ['Đã phân bổ', 'bg-cyan-50 text-chilled border-cyan-200'], SHIPPED: ['Đã xuất', 'bg-slate-100 text-slate-700 border-slate-200'],
  IN_TRANSIT: ['Đang giao', 'bg-cyan-50 text-chilled border-cyan-200'], DELIVERED: ['Đã nhận', 'bg-green-50 text-pass border-green-200'],
  REJECTED: ['Bị từ chối', 'bg-red-50 text-block border-red-200'], DRAFT: ['Nháp', 'bg-amber-50 text-ambient border-amber-200'],
  PUBLISHED: ['Đã publish', 'bg-green-50 text-pass border-green-200'], CANCELLED: ['Đã hủy', 'bg-slate-100 text-slate-600 border-slate-200'],
};
export function Status({ value }) {
  const [label, cls] = STATUS[value] || [value, 'bg-slate-100 text-slate-600 border-slate-200'];
  return <span className={`inline-block rounded border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ${cls}`}>{label}</span>;
}
export const EXPIRY = { USE_BY: '消費期限', BEST_BEFORE: '賞味期限' };
export const TERM = { ON_TRUCK: '車上渡し (giao trên xe)', DOORSTEP: '軒先渡し (giao tận cửa)' };
export function PageHeader({ title, children, note }) {
  return (<div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div><h1>{title}</h1>{note && <p className="mt-1 max-w-3xl text-sm text-slate-600">{note}</p>}</div>
    <div className="flex gap-2">{children}</div></div>);
}
export function Alert({ kind = 'error', children }) {
  const cls = kind === 'error' ? 'border-red-200 bg-red-50 text-block' : kind === 'ok' ? 'border-green-200 bg-green-50 text-pass' : 'border-amber-200 bg-amber-50 text-ambient';
  return <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-md border px-3 py-2 text-sm ${cls}`}>{children}</div>;
}
export function Loading() { return <p className="text-sm text-slate-500">Đang tải dữ liệu…</p>; }
export function LoadError({ error }) {
  if (!error) return null;
  if (error.status === 403) return <Alert>Tài khoản của bạn không có quyền xem màn hình này.</Alert>;
  return <Alert>{error.message}. Nếu lỗi kết nối cơ sở dữ liệu, vào Supabase Dashboard và bấm “Resume project”.</Alert>;
}
export function Mock({ children }) {
  return <p className="mt-2 text-xs text-slate-500"><span className="rounded bg-slate-200 px-1 py-0.5 font-medium text-slate-700">Mock</span> {children}</p>;
}
