// Shared schedule lane-packing — used by the public SchedulePreview and the
// admin live preview so both render the same layout.
//
// SMART PACKING ALGORITHM
//
// Objectives:
// 1. Side-by-Side: Concurrent events (overlaps) are forced into distinct lanes (columns).
// 2. Lane Re-use: Once an event ends, its lane is immediately available for the next one.
// 3. Buffer Protection: Short events "reserve" their lane for 45 mins to prevent visual crush.

import { formatFullTime } from "../data/schedule";

export function packEvents(events) {
  if (!events.length) return [];

  const sorted = [...events].sort(
    (a, b) =>
      a.startHour - b.startHour || events.indexOf(a) - events.indexOf(b),
  );

  const packed = [];
  const lanesUsedInClump = []; // end time of each lane

  sorted.forEach((evt) => {
    let laneIdx = -1;
    const start = evt.startHour;
    const isShort = evt.endHour - evt.startHour < 0.5;
    const bookingEnd = isShort ? Math.max(evt.endHour, start + 0.75) : evt.endHour;

    for (let i = 0; i < lanesUsedInClump.length; i++) {
      if (start >= lanesUsedInClump[i]) {
        laneIdx = i;
        break;
      }
    }

    if (laneIdx === -1) {
      laneIdx = lanesUsedInClump.length;
      lanesUsedInClump.push(bookingEnd);
    } else {
      lanesUsedInClump[laneIdx] = bookingEnd;
    }

    packed.push({ event: evt, laneIdx, totalLanes: 0 });
  });

  return packed.map((p) => {
    const concurrent = packed.filter((other) => {
      const pStart = p.event.startHour;
      const pEnd = Math.max(p.event.endHour, pStart + 0.1);
      const oStart = other.event.startHour;
      const oEnd = Math.max(other.event.endHour, oStart + 0.1);
      return pStart < oEnd && oStart < pEnd;
    });

    const maxLaneIdxAcrossGroup = Math.max(...concurrent.map((c) => c.laneIdx), 0);
    const totalLanesForGroup = maxLaneIdxAcrossGroup + 1;

    let laneSpan = 1;
    for (let l = p.laneIdx + 1; l < totalLanesForGroup; l++) {
      if (!concurrent.some((c) => c.laneIdx === l)) laneSpan++;
      else break;
    }

    return { ...p, totalLanes: totalLanesForGroup, laneSpan };
  });
}

// "10AM–11:30AM" style range for event cards.
export function getRangeLabel(start, end) {
  const fmt = (h) => formatFullTime(h).replace(":00 ", "").replace(" ", "");
  return start === end ? fmt(start) : `${fmt(start)}–${fmt(end)}`;
}
