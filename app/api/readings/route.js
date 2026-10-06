import { requireApi, ok } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export async function GET() {
  const { error } = await requireApi(); if (error) return error;
  const db = supabaseAdmin();
  const [r, l, b] = await Promise.all([
    db.from('temperature_readings').select('*').order('recorded_at', { ascending: false }).limit(300),
    db.from('locations').select('*'),
    db.from('temperature_band_versions').select('*').order('version', { ascending: false }),
  ]);
  const bandOf = Object.fromEntries((l.data || []).map((x) => [x.location_code, x.band]));
  const current = {}; for (const v of b.data || []) if (!current[v.band]) current[v.band] = v;
  const readings = (r.data || []).map((x) => {
    const v = current[bandOf[x.location_code]];
    const t = Number(x.temp_c);
    const out = v ? ((v.min_c !== null && t < Number(v.min_c)) || (v.max_c !== null && t > Number(v.max_c))) : false;
    return { ...x, band: bandOf[x.location_code], band_version: v?.version, min_c: v?.min_c, max_c: v?.max_c, out };
  });
  return ok({ readings });
}
