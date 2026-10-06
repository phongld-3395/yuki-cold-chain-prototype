import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLots } from './allocation.mjs';
import { checkRoute } from './driving.mjs';

const milk = { sku_code: 'CHI-002', band: 'CHILLED', expiry_type: 'BEST_BEFORE' };
const lot = (o) => ({ status: 'AVAILABLE', qty_available: 40, location_band: 'CHILLED', expiry_type: 'BEST_BEFORE', received_at: '2026-10-01', ...o });
const lotsMilk = [
  lot({ id: 1, lot_code: 'A', manufactured_on: '2026-09-25', expiry_date: '2026-10-09' }),
  lot({ id: 2, lot_code: 'B', manufactured_on: '2026-10-01', expiry_date: '2026-10-15' }),
  lot({ id: 3, lot_code: 'C', manufactured_on: '2026-10-04', expiry_date: '2026-10-18', qty_available: 60 }),
  lot({ id: 4, lot_code: 'D', manufactured_on: '2026-10-04', expiry_date: '2026-10-18', status: 'QUARANTINE' }),
];

test('SO-1001: 1/3 + 日付逆転 → chỉ lô C', () => {
  const r = evaluateLots({ sku: milk, agreement: { window_rule: 'ONE_THIRD' }, lots: lotsMilk,
    lastDelivered: { expiry_date: '2026-10-16' }, deliveryDate: '2026-10-06', qtyNeeded: 20 });
  assert.deepEqual(r.plan.map((p) => p.lot_code), ['C']);
  const a = r.rows.find((x) => x.lot.lot_code === 'A');
  assert.equal(a.checks.find((c) => c.key === 'date_reversal').ok, false);
});

test('Không mượn lịch sử khách khác: CUS-004 chưa có lịch sử → FEFO chọn B', () => {
  const r = evaluateLots({ sku: milk, agreement: { window_rule: 'ONE_HALF' }, lots: lotsMilk,
    lastDelivered: null, deliveryDate: '2026-10-06', qtyNeeded: 20 });
  assert.deepEqual(r.plan.map((p) => p.lot_code), ['B']);
});

test('BUSINESS-REVIEW → không lô nào hợp lệ', () => {
  const r = evaluateLots({ sku: milk, agreement: { window_rule: null }, lots: lotsMilk,
    lastDelivered: null, deliveryDate: '2026-10-06', qtyNeeded: 10 });
  assert.equal(r.businessReview, true); assert.equal(r.plan.length, 0); assert.equal(r.shortage, 10);
});

test('消費期限 đến hạn ngày giao → chặn cứng', () => {
  const tofu = { sku_code: 'CHI-001', band: 'CHILLED', expiry_type: 'USE_BY' };
  const r = evaluateLots({ sku: tofu, agreement: { window_rule: 'LABEL_DATE_ONLY' },
    lots: [lot({ id: 9, lot_code: 'T', expiry_type: 'USE_BY', manufactured_on: '2026-09-30', expiry_date: '2026-10-06' })],
    lastDelivered: null, deliveryDate: '2026-10-06', qtyNeeded: 5 });
  assert.equal(r.rows[0].checks[0].ok, false); assert.equal(r.plan.length, 0);
});

const rule = { version: 1, max_continuous_drive_min: 240, max_daily_restraint_min: 780, min_break_after_drive_min: 30 };
test('Tuyến R-01: 260 phút lái liên tục → vi phạm 10:10–10:30', () => {
  const r = checkRoute({ depotStart: '05:30', rule, stops: [
    { seq: 1, drive_min: 90, service_min: 20, break_min: 0 },
    { seq: 2, drive_min: 100, service_min: 20, break_min: 0 },
    { seq: 3, drive_min: 70, service_min: 20, break_min: 0 }] });
  assert.equal(r.ok, false);
  assert.equal(r.violations[0].from, '10:10'); assert.equal(r.violations[0].to, '10:30');
});
test('Tuyến R-02: có nghỉ 30 phút → hợp lệ', () => {
  const r = checkRoute({ depotStart: '06:00', rule, stops: [
    { seq: 1, drive_min: 60, service_min: 25, break_min: 0 },
    { seq: 2, drive_min: 80, service_min: 20, break_min: 30 },
    { seq: 3, drive_min: 50, service_min: 20, break_min: 0 }] });
  assert.equal(r.ok, true);
});
