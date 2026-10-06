// Kiểm tra giờ lái trong ngày theo rule version (FR-SCH-02). Prototype kiểm 2 giới hạn:
// lái liên tục ≤ max_continuous_drive_min (chỉ nghỉ ≥ min_break_after_drive_min mới reset; thời gian
// dỡ hàng KHÔNG tính là nghỉ) và tổng thời gian ràng buộc ≤ max_daily_restraint_min.
const toMin = (t) => { const [h, m] = String(t).slice(0, 5).split(':').map(Number); return h * 60 + m; };
const fmt = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export function checkRoute({ depotStart, stops, rule }) {
  const sorted = [...stops].sort((a, b) => a.seq - b.seq);
  const start = toMin(depotStart);
  let t = start, continuous = 0, drive = 0;
  const timeline = [], violations = [];
  for (const s of sorted) {
    const driveStart = t;
    const before = continuous;
    t += s.drive_min; continuous += s.drive_min; drive += s.drive_min;
    if (continuous > rule.max_continuous_drive_min) {
      const overFrom = driveStart + Math.max(0, rule.max_continuous_drive_min - before);
      violations.push({ type: 'CONTINUOUS_DRIVE', seq: s.seq, from: fmt(overFrom), to: fmt(t),
        message: `${fmt(overFrom)}–${fmt(t)}: lái liên tục ${continuous} phút, vượt ${rule.max_continuous_drive_min} phút`,
        suggestion: `Chèn nghỉ ≥ ${rule.min_break_after_drive_min} phút trước khi chạy tới điểm ${s.seq}` });
    }
    const arrive = t;
    t += s.service_min;
    if (s.break_min >= rule.min_break_after_drive_min) continuous = 0;
    t += s.break_min;
    timeline.push({ seq: s.seq, customer_code: s.customer_code, drive_start: fmt(driveStart), arrive: fmt(arrive),
      depart: fmt(t), continuous_after_drive: before + s.drive_min, break_min: s.break_min });
  }
  const restraint = t - start;
  if (restraint > rule.max_daily_restraint_min) {
    violations.push({ type: 'DAILY_RESTRAINT', from: fmt(start + rule.max_daily_restraint_min), to: fmt(t),
      message: `Thời gian ràng buộc ${restraint} phút, vượt ${rule.max_daily_restraint_min} phút/ngày`,
      suggestion: 'Tách bớt điểm dừng sang tuyến khác' });
  }
  return { ok: violations.length === 0, rule_version: rule.version, totals: { drive_min: drive, restraint_min: restraint }, timeline, violations };
}
