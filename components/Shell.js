'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NAV, ROLE_LABEL, canSee } from '@/lib/permissions';
import { DEMO_DATE } from '@/lib/config';
import { supabaseBrowser } from '@/lib/browser';

export default function Shell({ user, children }) {
  const path = usePathname(); const router = useRouter();
  async function logout() { await supabaseBrowser().auth.signOut(); router.replace('/login'); router.refresh(); }
  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-line bg-white md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="px-5 py-4">
          <div className="text-base font-semibold">Yuki Cold Chain</div>
          <div className="text-xs text-slate-500">ユキコールドロジスティクス</div>
        </div>
        <nav className="flex gap-4 overflow-x-auto px-3 pb-3 md:block md:space-y-4 md:overflow-visible">
          {NAV.map((g) => {
            const items = g.items.filter((i) => canSee(user.role, i.roles));
            if (!items.length) return null;
            return (<div key={g.group} className="min-w-max">
              <div className="px-2 pb-1 text-xs text-slate-400">{g.group}</div>
              {items.map((i) => {
                const active = i.href === '/' ? path === '/' : path.startsWith(i.href);
                return <Link key={i.href} href={i.href} className={`block rounded-md px-2 py-1.5 text-sm ${active ? 'bg-cyan-50 font-medium text-chilled' : 'text-ink hover:bg-mist'}`}>{i.label}</Link>;
              })}
            </div>);
          })}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white px-6 py-3">
          <div className="text-sm text-slate-600">Ngày nghiệp vụ demo: <span className="font-medium text-ink">{DEMO_DATE}</span></div>
          <div className="flex items-center gap-3 text-sm">
            <span><span className="font-medium">{user.full_name}</span> <span className="text-slate-500">({ROLE_LABEL[user.role]})</span></span>
            <button className="btn" onClick={logout}>Đăng xuất</button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
