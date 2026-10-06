import { daysBetween } from './dates.mjs';

// Quy tắc delivery window là TẬP QUÁN THƯƠNG MẠI theo hợp đồng khách–SKU (không phải luật).
// Tỷ lệ = thời hạn còn lại tại ngày giao / tổng thời hạn (NSX → hạn in trên nhãn).
const WINDOW = {
  ONE_THIRD: { min: 2 / 3, label: 'Quy tắc 1/3: còn ≥ 2/3 thời hạn' },
  ONE_HALF: { min: 1 / 2, label: 'Quy tắc 1/2: còn ≥ 1/2 thời hạn' },
  LABEL_DATE_ONLY: { min: null, label: 'Chỉ cần còn hạn in trên nhãn' },
};

/**
 * Đánh giá từng lô cho một dòng đơn. Thứ tự kiểm tra (BR-EXP-02 → BR-TEMP-02 → trạng thái →
 * BR-DELWIN-01 → BR-DATE-01), sau đó lô hợp lệ xếp FEFO, cùng hạn thì FIFO (BR-FEFO-01).
 * @param sku            { sku_code, band, expiry_type }
 * @param agreement      { window_rule } | null  (null hoặc window_rule null = BUSINESS-REVIEW)
 * @param lots           [{ id, lot_code, expiry_date, manufactured_on, expiry_type, status, qty_available, received_at, location_band }]
 * @param lastDelivered  { expiry_date, delivered_at } | null – lần giao ĐÃ NHẬN gần nhất của đúng cặp khách–SKU
 * @param deliveryDate   'YYYY-MM-DD' – ngày giao dự kiến của đơn
 */
export function evaluateLots({ sku, agreement, lots, lastDelivered, deliveryDate, qtyNeeded }) {
  const rule = agreement?.window_rule ?? null;
  const businessReview = !rule;
  const rows = lots.map((lot) => {
    const checks = [];
    // 1. 消費期限 – chặn cứng; 賞味期限 không chặn ở bước này
    if (lot.expiry_type === 'USE_BY') {
      const left = daysBetween(deliveryDate, lot.expiry_date);
      checks.push({ key: 'use_by', label: '消費期限', ok: left > 0,
        detail: left > 0 ? `Còn ${left} ngày tới hạn tiêu thụ` : `Đã đến/quá 消費期限 (${lot.expiry_date}) – chặn cứng` });
    } else {
      checks.push({ key: 'use_by', label: '消費期限', ok: true, detail: '賞味期限: không chặn cứng, xét theo hợp đồng' });
    }
    // 2. Dải nhiệt của vị trí lưu phải khớp SKU
    const bandOk = lot.location_band === sku.band;
    checks.push({ key: 'band', label: 'Dải nhiệt', ok: bandOk,
      detail: bandOk ? `Đúng dải ${sku.band}` : `Lô đang ở vị trí ${lot.location_band || '?'}, SKU yêu cầu ${sku.band}` });
    // 3. Trạng thái & tồn
    const statusOk = ['AVAILABLE', 'RELEASED'].includes(lot.status) && lot.qty_available > 0;
    checks.push({ key: 'status', label: 'Trạng thái', ok: statusOk,
      detail: statusOk ? `${lot.status}, còn ${lot.qty_available}` : (lot.status === 'QUARANTINE' ? 'Đang cách ly' : lot.qty_available <= 0 ? 'Hết tồn' : lot.status) });
    // 4. Delivery window theo hợp đồng
    if (businessReview) {
      checks.push({ key: 'window', label: 'Delivery window', ok: false, detail: 'Hợp đồng khách–SKU chưa chốt quy tắc (BUSINESS-REVIEW)' });
    } else {
      const total = daysBetween(lot.manufactured_on, lot.expiry_date);
      const left = daysBetween(deliveryDate, lot.expiry_date);
      const ratio = total > 0 ? left / total : 0;
      const w = WINDOW[rule];
      const wOk = w.min === null ? left > 0 : ratio >= w.min;
      checks.push({ key: 'window', label: 'Delivery window', ok: wOk,
        detail: `${w.label} · thực tế còn ${left}/${total} ngày (${Math.round(ratio * 100)}%)` });
    }
    // 5. 日付逆転禁止 – so với lần giao ĐÃ NHẬN gần nhất của cùng khách–SKU, không so với hôm nay
    if (!lastDelivered) {
      checks.push({ key: 'date_reversal', label: '日付逆転', ok: true, detail: 'Khách chưa nhận SKU này lần nào' });
    } else {
      const drOk = lot.expiry_date >= lastDelivered.expiry_date;
      checks.push({ key: 'date_reversal', label: '日付逆転', ok: drOk,
        detail: drOk ? `Hạn ${lot.expiry_date} ≥ lần giao trước (${lastDelivered.expiry_date})`
          : `Hạn ${lot.expiry_date} CŨ HƠN lô khách đã nhận (${lastDelivered.expiry_date})` });
    }
    return { lot, checks, eligible: checks.every((c) => c.ok) };
  });

  const eligible = rows.filter((r) => r.eligible)
    .sort((a, b) => (a.lot.expiry_date < b.lot.expiry_date ? -1 : a.lot.expiry_date > b.lot.expiry_date ? 1
      : String(a.lot.received_at) < String(b.lot.received_at) ? -1 : 1));
  const plan = []; let rest = qtyNeeded;
  for (const r of eligible) {
    if (rest <= 0) break;
    const take = Math.min(rest, r.lot.qty_available);
    plan.push({ lot_id: r.lot.id, lot_code: r.lot.lot_code, expiry_date: r.lot.expiry_date, qty: take });
    rest -= take;
  }
  rows.sort((a, b) => (a.lot.expiry_date < b.lot.expiry_date ? -1 : 1));
  return { rule, businessReview, rows, plan, shortage: Math.max(rest, 0), lastDelivered };
}
