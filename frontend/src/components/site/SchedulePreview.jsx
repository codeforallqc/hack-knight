// SchedulePreview — homepage teaser with a day-tab switcher.
// Shows one day at a time; links to the full 3-column grid at /schedule.
// The grid itself renders via the shared ScheduleGrid component
// (also used by the admin dashboard's live preview).

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSchedule } from '../../hooks/useSchedule';
import ScheduleGrid from './ScheduleGrid';

export default function SchedulePreview() {
  const { events: scheduleEvents, days: scheduleDays } = useSchedule(); // Fetch from API (static fallback)
  const [activeDay, setActiveDay] = useState(scheduleDays[0].key);

  // Hour window spans every day's events so the grid height is stable
  // when switching between day tabs.
  const startHours = scheduleEvents.map(e => Math.floor(e.startHour));
  const endHours = scheduleEvents.map(e => Math.ceil(e.endHour));
  const minHour = Math.min(...startHours);
  const maxHour = Math.max(...endHours);

  const dayEvents = scheduleEvents.filter(e => e.day === activeDay);

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
        <div className="schedule-grid-wrapper max-w-5xl mx-auto">
          <ScheduleGrid events={dayEvents} minHour={minHour} maxHour={maxHour} />
        </div>
      </div>

      <div className="text-center mt-8">
        <Link to="/schedule" className="btn-outline">
          View Full Schedule
        </Link>
      </div>
    </section>
  );
}
