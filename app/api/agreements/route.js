import { requireApi, ok, bad, audit } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
const RULES = ['ONE_THIRD', 'ONE_HALF', 'LABEL_DATE_ONLY'];
export async function PATCH(req) {
  const { user, error } = await requireApi(['sales', 'planner']); if (error) return error;
  const { id, window_rule, note } = await req.json();
  if (window_rule !== null && !RULES.includes(window_rule)) return bad('Quy tắc delivery window không hợp lệ.');
  const db = supabaseAdmin();
  const { data: before } = await db.from('customer_sku_agreements').select('*').eq('id', id).single();
  if (!before) return bad('Không tìm thấy hợp đồng khách–SKU.', 404);
  const { data: after, error: e } = await db.from('customer_sku_agreements').update({ window_rule, note: note ?? before.note }).eq('id', id).select().single();
  if (e) return bad(e.message, 500);
  await audit(user, 'UPDATE_WINDOW_RULE', 'customer_sku_agreements', id, before, after);
  return ok({ agreement: after });
}
