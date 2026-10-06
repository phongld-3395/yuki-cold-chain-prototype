'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/browser';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('');
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setErr(error.message === 'Invalid login credentials' ? 'Email hoặc mật khẩu không đúng.' : `Không đăng nhập được: ${error.message}`);
    router.replace('/'); router.refresh();
  }
  return (
    <main className="grid min-h-screen place-items-center bg-mist px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2 w-10 rounded bg-ambient" /><span className="h-2 w-10 rounded bg-chilled" /><span className="h-2 w-10 rounded bg-frozen" />
          </div>
          <h1 className="mt-4">Yuki Cold Chain</h1>
          <p className="text-sm text-slate-600">Quản lý kho lạnh 3 dải nhiệt · bản prototype</p>
        </div>
        <form onSubmit={submit} className="card space-y-4 p-6">
          <div><label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" required autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="label" htmlFor="pw">Mật khẩu</label>
            <input id="pw" type="password" required autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {err && <p role="alert" className="text-sm text-block">{err}</p>}
          <button className="btn-primary w-full justify-center" disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
        </form>
        <p className="mt-4 text-xs text-slate-500">Tài khoản demo xem trong README của repo.</p>
      </div>
    </main>
  );
}
