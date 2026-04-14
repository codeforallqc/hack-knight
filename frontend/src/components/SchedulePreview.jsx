// SchedulePreview — homepage teaser with a day-tab switcher.
// Shows one day at a time; links to the full 3-column grid at /schedule.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  scheduleEvents,
  scheduleDays,
  formatHour,
  formatFullTime,
} from '../data/schedule';

/**
 * SMART PACKING ALGORITHM
 *
 * Objectives:
 * 1. Side-by-Side: Concurrent events (overlaps) are forced into distinct lanes (columns).
 * 2. Lane Re-use: Once an event ends, its lane is immediately available for the next one.
 * 3. Buffer Protection: Short events "reserve" their lane for 45 mins to prevent visual crush.
 */
function packEvents(events) { // Function to pack events into lanes
  if (!events.length) return []; // Return empty array if no events

  const sorted = [...events].sort((a, b) => // Sort events by start hour, then by index in scheduleEvents
    a.startHour - b.startHour ||
    scheduleEvents.indexOf(a) - scheduleEvents.indexOf(b)
  );

  const packed = []; // Array to store packed events
  const lanesUsedInClump = []; // Array to store the end time of each lane

  sorted.forEach(evt => { // Iterate over sorted events
    let laneIdx = -1;
    const start = evt.startHour;
    const isShort = (evt.endHour - evt.startHour) < 0.5;
    const bookingEnd = isShort ? Math.max(evt.endHour, start + 0.75) : evt.endHour;

    for (let i = 0; i < lanesUsedInClump.length; i++) { // Find the first available lane
      if (start >= lanesUsedInClump[i]) { laneIdx = i; break; }
    }

    if (laneIdx === -1) { // If no available lane is found, create a new one
      laneIdx = lanesUsedInClump.length;
      lanesUsedInClump.push(bookingEnd);
    } else {
      lanesUsedInClump[laneIdx] = bookingEnd;
    }

    packed.push({ event: evt, laneIdx, totalLanes: 0 }); // Add the packed event to the array
  });

  return packed.map(p => { // Map over packed events to calculate total lanes and lane span
    const concurrent = packed.filter(other => { // Filter for concurrent events
      const pStart = p.event.startHour;
      const pEnd = Math.max(p.event.endHour, pStart + 0.1);
      const oStart = other.event.startHour;
      const oEnd = Math.max(other.event.endHour, oStart + 0.1);
      return pStart < oEnd && oStart < pEnd;
    });

    const maxLaneIdxAcrossGroup = Math.max(...concurrent.map(c => c.laneIdx), 0); // Find the maximum lane index across all concurrent events
    const totalLanesForGroup = maxLaneIdxAcrossGroup + 1; // Calculate the total number of lanes needed for the group

    let laneSpan = 1;
    for (let l = p.laneIdx + 1; l < totalLanesForGroup; l++) { // Calculate the lane span for the current event
      if (!concurrent.some(c => c.laneIdx === l)) laneSpan++;
      else break;
    }

    return { ...p, totalLanes: totalLanesForGroup, laneSpan }; // Return the packed event with total lanes and lane span
  });
}

function getRangeLabel(start, end) { // Format the time range for display
  const fmt = h => formatFullTime(h).replace(':00 ', '').replace(' ', ''); // Format the time for display
  return start === end ? fmt(start) : `${fmt(start)}–${fmt(end)}`; // Return the formatted time range
}

export default function SchedulePreview() { // Component to display the schedule preview
  const [activeDay, setActiveDay] = useState(scheduleDays[0].key); // State to store the active day

  const startHours = scheduleEvents.map(e => Math.floor(e.startHour)); // Get the start hours of all events
  const endHours = scheduleEvents.map(e => Math.ceil(e.endHour)); // Get the end hours of all events
  const minHour = Math.min(...startHours); // Find the minimum start hour
  const maxHour = Math.max(...endHours); // Find the maximum end hour
  const totalSlots = (maxHour - minHour) * 2 + 1; // Calculate the total number of slots
  const getRow = h => Math.round((h - minHour) * 2) + 2; // Get the row for a given hour

  const dayEvents = scheduleEvents.filter(e => e.day === activeDay); // Filter events for the active day
  const packed = packEvents(dayEvents); // Pack events into lanes

  return (
    <section className="section-wrapper py-24" id="schedule">
      <div className="text-center mb-8">
        <h2 className="section-title">Event Schedule</h2>
      </div>

      {/* Day tab switcher — outside the card */}
      <div className="flex justify-center gap-3 flex-wrap mb-6">
        {scheduleDays.map(day => (
          <button
            key={day.key}
            id={`preview-tab-${day.key}`}
            onClick={() => setActiveDay(day.key)}
            className={`schedule-tab${activeDay === day.key ? ' schedule-tab-active' : ''}`}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Surface card — wraps just the schedule grid */}
      <div className="bg-surface rounded-3xl py-6 sm:py-10 px-4 sm:px-8 mt-2">
      {/* Single-day grid */}
      <div className="schedule-grid-wrapper max-w-5xl mx-auto">
        <div
          className="schedule-grid"
          style={{
            gridTemplateColumns: '5rem 1fr',
            gridTemplateRows: `repeat(${totalSlots}, 1.8rem)`,
          }}
        >
          {/* Time sidebar — row indices now start at 1 (no header row) */}
          {Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i).map(hour => (
            <div
              key={`label-${hour}`}
              className="schedule-time-label"
              style={{ gridRow: `${getRow(hour) - 1} / span 2`, gridColumn: 1 }}
            >
              {formatHour(hour)}
            </div>
          ))}

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
                    ? '1px dashed rgba(255,255,255,0.05)'
                    : '1px solid rgba(255,255,255,0.05)',
              }}
            />
          ))}

          {/* Events */}
          {packed.map((item, pIdx) => {
            const { event, laneIdx, totalLanes } = item;
            const startRow = getRow(event.startHour) - 1;
            const endRow = getRow(event.endHour) - 1;
            const span = Math.max(endRow - startRow, 1);
            return (
              <div
                key={pIdx}
                className={`schedule-event color-${event.color ?? 'violet'}`}
                style={{
                  gridRow: `${startRow} / span ${span}`,
                  gridColumn: 2,
                  width: `calc(${(100 / totalLanes) * (item.laneSpan || 1)}% - 8px)`,
                  marginLeft: `calc(${laneIdx * (100 / totalLanes)}% + 4px)`,
                  marginTop: '2px',
                  marginBottom: '2px',
                }}
                title={event.label}
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
              style={{ gridRow: '1 / span 4', gridColumn: 2 }}
              className="flex items-center justify-center font-mono text-sm text-text-muted"
            >
              No events scheduled yet.
            </div>
          )}
        </div>
      </div>
      </div>{/* end surface card */}

      <div className="text-center mt-8">
        <Link to="/schedule" className="btn-outline">
          View Full Schedule
        </Link>
      </div>
    </section>
  );
}