'use client';
import { useCallback, useEffect, useState } from 'react';

export async function api(path, opts = {}) {
  const res = await fetch(path, { method: opts.method || 'GET', cache: 'no-store',
    headers: { 'Content-Type': 'application/json' }, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.error || `Lỗi ${res.status}`); e.status = res.status; e.data = data; throw e; }
  return data;
}

export function useLoad(path) {
  const [state, set] = useState({ data: null, error: null, loading: true });
  const reload = useCallback(() => {
    set((s) => ({ ...s, loading: true }));
    api(path).then((data) => set({ data, error: null, loading: false })).catch((error) => set({ data: null, error, loading: false }));
  }, [path]);
  useEffect(() => { reload(); }, [reload]);
  return { ...state, reload };
}
