// Single-day schedule grid — the shared renderer behind the public
// SchedulePreview and the admin live preview. Presentational only:
// pass pre-filtered day events plus the hour window to draw.

import { formatHour } from "../../data/schedule";
import { packEvents, getRangeLabel } from "../../lib/schedulePacking";

export default function ScheduleGrid({
  events,
  minHour,
  maxHour,
  onEventClick,
  eventClassName,
}) {
  const totalSlots = (maxHour - minHour) * 2 + 1;
  const getRow = (h) => Math.round((h - minHour) * 2) + 2;
  const packed = packEvents(events);

  return (
    <div
      className="schedule-grid"
      style={{
        gridTemplateColumns: "5rem 1fr",
        gridTemplateRows: `repeat(${totalSlots}, 1.8rem)`,
      }}
    >
      {/* Time sidebar — row indices start at 1 (no header row) */}
      {Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i).map(
        (hour) => (
          <div
            key={`label-${hour}`}
            className="schedule-time-label"
            style={{ gridRow: `${getRow(hour) - 1} / span 2`, gridColumn: 1 }}
          >
            {formatHour(hour)}
          </div>
        ),
      )}

      {/* Background cells */}
      {Array.from({ length: totalSlots }, (_, slot) => (
        <div
          key={`bg-${slot}`}
          className="schedule-cell"
          style={{
            gridRow: slot + 1,
            gridColumn: 2,
            borderBottom:
              slot % 2 === 0
                ? "1px dashed rgba(255,255,255,0.05)"
                : "1px solid rgba(255,255,255,0.05)",
          }}
        />
      ))}

      {/* Events */}
      {packed.map((item, pIdx) => {
        const { event, laneIdx, totalLanes } = item;
        const startRow = getRow(event.startHour) - 1;
        const endRow = getRow(event.endHour) - 1;
        const span = Math.max(endRow - startRow, 1);
        const extra = eventClassName ? eventClassName(event) : "";
        return (
          <div
            key={event.id ?? pIdx}
            className={`schedule-event color-${event.color ?? "violet"}${
              extra ? ` ${extra}` : ""
            }`}
            style={{
              gridRow: `${startRow} / span ${span}`,
              gridColumn: 2,
              width: `calc(${(100 / totalLanes) * (item.laneSpan || 1)}% - 8px)`,
              marginLeft: `calc(${laneIdx * (100 / totalLanes)}% + 4px)`,
              marginTop: "2px",
              marginBottom: "2px",
            }}
            title={event.label}
            onClick={onEventClick ? () => onEventClick(event) : undefined}
            role={onEventClick ? "button" : undefined}
            tabIndex={onEventClick ? 0 : undefined}
            onKeyDown={
              onEventClick
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onEventClick(event);
                    }
                  }
                : undefined
            }
          >
            <span className="schedule-event-title">{event.label}</span>
            <span className="schedule-event-time font-bold opacity-80 mt-0.5">
              {getRangeLabel(event.startHour, event.endHour)}
            </span>
          </div>
        );
      })}

      {packed.length === 0 && (
        <div
          style={{ gridRow: "1 / span 4", gridColumn: 2 }}
          className="flex items-center justify-center font-mono text-sm text-text-muted"
        >
          No events scheduled yet.
        </div>
      )}
    </div>
  );
}
