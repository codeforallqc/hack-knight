// Each event maps to a day column and a time range (24-hour).
// startHour / endHour accept whole numbers OR decimals:
//   10   → 10:00 AM
//   10.5 → 10:30 AM
// The grid uses 30-minute rows, so a span of 1.5 fills 3 rows.

export const scheduleEvents = [

  // ── Friday (day 1) ──────────────────────────────────
  { day: "fri", startHour: 10, endHour: 11, label: "Check-in begins", color: "cyan" },
  { day: "fri", startHour: 11, endHour: 12, label: "Opening Ceremony begins", color: "violet" },
  { day: "fri", startHour: 12, endHour: 13, label: "Hacking Begins", color: "green" },
  { day: "fri", startHour: 13, endHour: 14, label: "Lunch", color: "orange" },
  { day: "fri", startHour: 19, endHour: 20, label: "Dinner", color: "orange" },
  { day: "fri", startHour: 23, endHour: 24, label: "Midnight Ramen", color: "orange" },

  // ── Saturday (day 2) ────────────────────────────────
  { day: "sat", startHour: 9, endHour: 10, label: "Breakfast", color: "orange" },
  { day: "sat", startHour: 13, endHour: 14, label: "Lunch", color: "orange" },
  { day: "sat", startHour: 18, endHour: 19, label: "Dinner", color: "orange" },
  { day: "sat", startHour: 23, endHour: 24, label: "Midnight Ramen", color: "orange" },

  // ── Sunday (day 3) ──────────────────────────────────
  { day: "sun", startHour: 9, endHour: 10, label: "Check-in starts", color: "cyan", },
  { day: "sun", startHour: 12, endHour: 13, label: "Submission Deadline", color: "green" },
  { day: "sun", startHour: 12, endHour: 13, label: "Lunch", color: "orange" },
  { day: "sun", startHour: 12.5, endHour: 16.5, label: "Judging", color: "violet" },
  { day: "sun", startHour: 16, endHour: 17, label: "Closing Ceremony", color: "violet" },
];

// The 3 day columns — used to build the grid headers + event lookup
export const scheduleDays = [
  { key: "fri", label: "Fri Oct 9" },
  { key: "sat", label: "Sat Oct 10" },
  { key: "sun", label: "Sun Oct 11" },
];

// Every whole hour from 6 AM to midnight (the sidebar labels)
export const scheduleHours = Array.from(
  { length: 24 - 6 + 1 },
  (_, i) => 6 + i
);

// For the sidebar: "12 PM", "1 PM", etc.
export function formatHour(h) {
  if (h === 24 || h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

// For event cards: "12:00 PM", "12:30 PM", etc.
export function formatFullTime(hour) {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatShortTime(hour) {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return m === 0 ? `${displayH}${period}` : `${displayH}:${String(m).padStart(2, '0')}${period}`;
}

// Convert a decimal hour to a 0-based slot index (6 AM = slot 0)
export function hourToSlot(decimalHour) {
  return Math.floor(decimalHour - 6);
}