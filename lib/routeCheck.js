import { supabaseAdmin } from './supabase';
import { checkRoute } from './rules/driving.mjs';
import { DEMO_DATE } from './config';
export async function loadAndCheck(id) {
  const db = supabaseAdmin();
  const { data: route } = await db.from('routes').select('*, stops:route_stops(*, customer:customers(name))').eq('id', id).single();
  if (!route) return {};
  const { data: rule } = await db.from('driver_rule_versions').select('*').lte('effective_from', route.route_date || DEMO_DATE)
    .order('version', { ascending: false }).limit(1).single();
  const result = checkRoute({ depotStart: route.depot_start, stops: route.stops, rule });
  return { route, rule, result };
}
