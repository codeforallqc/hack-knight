import React from 'react';
import { motion } from 'motion/react';

// ── Shared animation variants (from onboarding docs) ──────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ── Helper wrapper to label each component section ───────────────────────────

function ComponentRow({ name, children }) {
  return (
    <motion.div
      className="border border-border rounded-card p-8 mb-8 bg-surface/40"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <p className="font-mono text-xs text-ultraviolet uppercase tracking-widest mb-6">
        .{name}
      </p>
      <div className="flex flex-wrap gap-4 items-start">
        {children}
      </div>
    </motion.div>
  );
}

// ── Schedule Grid Component ───────────────────────────────────────────────────

const DAYS = ['Fri 10/17', 'Sat 10/18', 'Sun 10/19'];
const START_HOUR = 6;   // 6 AM
const TOTAL_HOURS = 19; // 6 AM → 12 AM (midnight)

const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

const formatHour = (h) => {
  const n = h % 24;
  if (n === 0) return '12AM';
  if (n === 12) return '12PM';
  return n < 12 ? `${n}AM` : `${n - 12}PM`;
};

// day: 0=Fri, 1=Sat, 2=Sun  |  start/end in 24h integers
const EVENTS = [
  { day: 0, start: 11, end: 12, title: 'Opening Ceremony' },
  { day: 0, start: 13, end: 17, title: 'Lorem Ipsum Session' },
  { day: 1, start:  9, end: 11, title: 'Lorem Workshops' },
  { day: 1, start: 14, end: 15, title: 'Lorem Lunch' },
  { day: 1, start: 18, end: 21, title: 'Evening Lorem' },
  { day: 1, start: 21, end: 24, title: 'Late Night Ipsum' },
  { day: 2, start: 12, end: 17, title: 'Final Lorem' },
  { day: 2, start: 17, end: 22, title: 'Demos & Awards' },
];

// Row 1 = header, Row 2 = START_HOUR
const toRow = (hour) => hour - START_HOUR + 2;
const toCol = (dayIdx) => dayIdx + 2; // col 1 = time labels

function ScheduleGrid() {
  return (
    <div className="schedule-grid-wrapper">
      <div
        className="schedule-grid"
        style={{ gridTemplateColumns: '3.5rem repeat(3, 1fr)' }}
      >
        {/* ── Header row ── */}
        <div className="schedule-grid-corner" style={{ gridRow: 1, gridColumn: 1 }} />
        {DAYS.map((day, i) => (
          <div key={day} className="schedule-day-header" style={{ gridRow: 1, gridColumn: i + 2 }}>
            {day}
          </div>
        ))}

        {/* ── Time labels + background cells ── */}
        {hours.map((hour, idx) => {
          const row = idx + 2;
          return (
            <React.Fragment key={hour}>
              <div className="schedule-time-label" style={{ gridRow: row, gridColumn: 1 }}>
                {formatHour(hour)}
              </div>
              {DAYS.map((_, dayIdx) => (
                <div
                  key={dayIdx}
                  className="schedule-cell"
                  style={{ gridRow: row, gridColumn: dayIdx + 2 }}
                />
              ))}
            </React.Fragment>
          );
        })}

        {/* ── Events (rendered after cells so they layer on top) ── */}
        {EVENTS.map((evt, i) => (
          <div
            key={i}
            className="schedule-event"
            style={{
              gridRow: `${toRow(evt.start)} / ${toRow(evt.end)}`,
              gridColumn: toCol(evt.day),
            }}
          >
            <span className="schedule-event-time">{formatHour(evt.start)}</span>
            <span className="schedule-event-title">{evt.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function App() {
  return (
    <div className="min-h-screen bg-void px-8 py-12 max-w-5xl mx-auto">

      {/* Page header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="font-display text-4xl text-text-primary mb-2">Component Showcase</h1>
        <p className="font-body text-text-secondary mb-12">
          Scroll down — each section fades up using the <code className="font-mono text-ultraviolet text-sm">fadeUp</code> variant.
        </p>
      </motion.div>

      {/* .navbar */}
      <ComponentRow name="navbar + navbar-link">
        <div
          className="navbar w-full"
          style={{ position: 'relative', top: 'auto', left: 'auto', right: 'auto' }}
        >
          <span className="font-display text-text-primary">Header</span>
          <div className="flex gap-6">
            <a className="navbar-link" href="#">Link</a>
            <a className="navbar-link" href="#">Link</a>
            <a className="navbar-link" href="#">Link</a>
          </div>
        </div>
      </ComponentRow>

      {/* .btn-primary / .btn-outline */}
      <ComponentRow name="btn-primary / btn-outline">
        <button className="btn-primary">btn-primary</button>
        <button className="btn-outline">btn-outline</button>
      </ComponentRow>

      {/* .section-title / .section-subtitle */}
      <ComponentRow name="section-title / section-subtitle">
        <div>
          <h2 className="section-title">Header</h2>
          <p className="section-subtitle">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
        </div>
      </ComponentRow>

      {/* .card — single */}
      <ComponentRow name="card">
        <div className="card w-72">
          <h3 className="font-display text-lg text-text-primary mb-2">Header</h3>
          <p className="font-body text-text-secondary text-sm">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.
          </p>
        </div>
      </ComponentRow>

      {/* .card-team — staggered grid */}
      <motion.div
        className="border border-border rounded-card p-8 mb-8 bg-surface/40"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <p className="font-mono text-xs text-ultraviolet uppercase tracking-widest mb-6">
          .card-team — staggered with <code className="text-text-secondary normal-case">staggerChildren: 0.1</code>
        </p>
        <motion.div
          className="grid grid-cols-3 gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {['Lorem', 'Ipsum', 'Dolor'].map((name) => (
            <motion.div key={name} variants={fadeUp}>
              <div className="card-team">
                <div className="w-16 h-16 rounded-full bg-border flex items-center justify-center text-text-muted text-xs">
                  IMG
                </div>
                <div>
                  <h3 className="font-display text-base text-text-primary">{name} Sit</h3>
                  <p className="font-body text-xs text-ultraviolet">Lorem ipsum</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* .card-sponsor */}
      <ComponentRow name="card-sponsor">
        <div className="card-sponsor w-48 h-28">
          <span className="font-mono text-text-muted text-sm">LOGO</span>
        </div>
      </ComponentRow>

      {/* .timer-digit / .timer-label */}
      <ComponentRow name="timer-digit / timer-label">
        <div className="flex gap-4 items-start">
          {['12', '34', '56'].map((n, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center">
                <span className="timer-digit">{n}</span>
                <p className="timer-label">{['hours', 'minutes', 'seconds'][i]}</p>
              </div>
              {i < 2 && <span className="timer-digit">:</span>}
            </React.Fragment>
          ))}
        </div>
      </ComponentRow>



      {/* .schedule-tab / .schedule-tab-active */}
      <ComponentRow name="schedule-tab / schedule-tab-active">
        <button className="schedule-tab schedule-tab-active">Active Tab</button>
        <button className="schedule-tab">Inactive Tab</button>
        <button className="schedule-tab">Inactive Tab</button>
      </ComponentRow>

      {/* Schedule Calendar Grid */}
      <motion.div
        className="border border-border rounded-card p-8 mb-8 bg-surface/40"
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        <p className="font-mono text-xs text-ultraviolet uppercase tracking-widest mb-6">
          .schedule-grid-wrapper / .schedule-grid / .schedule-event
        </p>
        <ScheduleGrid />
      </motion.div>

      {/* .faq-item */}
      <ComponentRow name="faq-item / faq-question / faq-answer">
        <div className="w-full">
          <div className="faq-item">
            <div className="faq-question">
              <span>Lorem ipsum dolor sit amet?</span>
              <span className="text-ultraviolet text-xl leading-none">−</span>
            </div>
            <p className="faq-answer">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
          </div>
          <div className="faq-item">
            <div className="faq-question">
              <span>Consectetur adipiscing elit?</span>
              <span className="text-text-muted text-xl leading-none">+</span>
            </div>
          </div>
        </div>
      </ComponentRow>

      {/* .marquee-wrapper / .marquee-track */}
      <ComponentRow name="marquee-wrapper / marquee-track">
        <div className="marquee-wrapper w-full">
          <div className="marquee-track">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-32 h-16 bg-border rounded-card flex items-center justify-center"
              >
                <span className="font-mono text-text-muted text-xs">LOGO</span>
              </div>
            ))}
          </div>
        </div>
      </ComponentRow>

    </div>
  );
}

export default App;
