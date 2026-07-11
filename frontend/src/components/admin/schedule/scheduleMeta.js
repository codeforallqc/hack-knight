// Shared vocabulary for the schedule tab — event colors, time options,
// and the API-row ↔ editor-shape helpers.

import { formatShortTime } from "../../../data/schedule";

export const EVENT_COLORS = [
  { value: "violet", label: "Ceremony", swatch: "var(--color-ultraviolet)" },
  { value: "cyan", label: "Check-in", swatch: "var(--color-electric-blue)" },
  { value: "green", label: "Hacking", swatch: "var(--color-cyber-teal)" },
  { value: "orange", label: "Food", swatch: "var(--color-signal-yellow)" },
];

// 30-minute increments across the full day.
export const TIME_OPTIONS = Array.from({ length: 49 }, (_, i) => i / 2);

export function mapEvent(e) {
  return {
    id: e.id,
    day: e.day,
    startHour: Number(e.start_hour),
    endHour: Number(e.end_hour),
    label: e.label,
    color: e.color ?? "violet",
  };
}

export function eventsEqual(a, b) {
  return (
    a.day === b.day &&
    a.startHour === b.startHour &&
    a.endHour === b.endHour &&
    a.label === b.label &&
    a.color === b.color
  );
}

export function timeRange(ev) {
  return `${formatShortTime(ev.startHour)}–${formatShortTime(ev.endHour)}`;
}
