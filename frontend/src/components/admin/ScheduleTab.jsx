// Schedule admin tab — staged editor + live preview.
// Nothing touches the server until the diff modal is confirmed: edits to
// day headers and events accumulate in draft state, the preview renders
// the draft through the same ScheduleGrid the public site uses.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../../lib/api";
import { formatFullTime, formatShortTime } from "../../data/schedule";
import ScheduleGrid from "../ScheduleGrid";
import { Panel, Field, EmptyState, SaveBar, DiffModal, Modal } from "./ui";

const EVENT_COLORS = [
  { value: "violet", label: "Ceremony", swatch: "var(--color-ultraviolet)" },
  { value: "cyan", label: "Check-in", swatch: "var(--color-electric-blue)" },
  { value: "green", label: "Hacking", swatch: "var(--color-cyber-teal)" },
  { value: "orange", label: "Food", swatch: "var(--color-signal-yellow)" },
];

// 30-minute increments across the full day.
const TIME_OPTIONS = Array.from({ length: 49 }, (_, i) => i / 2);

function mapEvent(e) {
  return {
    id: e.id,
    day: e.day,
    startHour: Number(e.start_hour),
    endHour: Number(e.end_hour),
    label: e.label,
    color: e.color ?? "violet",
  };
}

function eventsEqual(a, b) {
  return (
    a.day === b.day &&
    a.startHour === b.startHour &&
    a.endHour === b.endHour &&
    a.label === b.label &&
    a.color === b.color
  );
}

function timeRange(ev) {
  return `${formatShortTime(ev.startHour)}–${formatShortTime(ev.endHour)}`;
}

/* ── Add / edit event modal ── */

function EventModal({ open, initial, days, onSubmit, onClose }) {
  const [form, setForm] = useState(initial);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(initial);
      setFormError(null);
    }
  }, [open, initial]);

  function submit(e) {
    e.preventDefault();
    if (!form.label.trim()) {
      setFormError("Label is required");
      return;
    }
    if (form.endHour <= form.startHour) {
      setFormError("End time must be after the start time");
      return;
    }
    onSubmit({ ...form, label: form.label.trim() });
  }

  if (!form) return null;

  return (
    <Modal
      open={open}
      title={form.id ? "Edit Event" : "New Event"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Label" htmlFor="event-label">
          <input
            id="event-label"
            className="admin-input"
            placeholder="e.g. Opening Ceremony"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            autoFocus
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Day" htmlFor="event-day">
            <select
              id="event-day"
              className="admin-select"
              value={form.day}
              onChange={(e) => setForm({ ...form, day: e.target.value })}
            >
              {days.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Start" htmlFor="event-start">
            <select
              id="event-start"
              className="admin-select"
              value={form.startHour}
              onChange={(e) =>
                setForm({ ...form, startHour: Number(e.target.value) })
              }
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {formatFullTime(t)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="End" htmlFor="event-end">
            <select
              id="event-end"
              className="admin-select"
              value={form.endHour}
              onChange={(e) =>
                setForm({ ...form, endHour: Number(e.target.value) })
              }
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {formatFullTime(t)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Color">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Event color">
            {EVENT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setForm({ ...form, color: c.value })}
                aria-pressed={form.color === c.value}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-xs uppercase tracking-wide transition-colors duration-150 ease-brand ${
                  form.color === c.value
                    ? "border-ultraviolet/60 bg-black/30 text-text-primary"
                    : "border-border/40 text-text-secondary hover:border-border/60"
                }`}
              >
                <span
                  className="w-3 h-3 rounded-pill"
                  style={{ background: c.swatch }}
                  aria-hidden="true"
                />
                {c.label}
              </button>
            ))}
          </div>
        </Field>

        {formError && <p className="admin-error">{formError}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" className="admin-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="admin-btn-primary">
            {form.id ? "Apply" : "Add Event"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Tab ── */

export default function ScheduleTab({ onDirtyChange }) {
  const [serverEvents, setServerEvents] = useState([]);
  const [serverDays, setServerDays] = useState([]);
  const [draftEvents, setDraftEvents] = useState([]);
  const [draftDays, setDraftDays] = useState([]);
  const [activeDay, setActiveDay] = useState("fri");
  const [editing, setEditing] = useState(null); // form seed for EventModal
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [error, setError] = useState(null);
  const tmpIdRef = useRef(0);

  const load = useCallback(async () => {
    try {
      const [ev, dy] = await Promise.all([
        apiGet("/schedule"),
        apiGet("/schedule/days"),
      ]);
      const mapped = ev.map(mapEvent);
      setServerEvents(mapped);
      setServerDays(dy);
      setDraftEvents(mapped);
      setDraftDays(dy.map((d) => ({ ...d })));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Staged diff ── */

  const changes = useMemo(() => {
    const list = [];

    for (const day of draftDays) {
      const orig = serverDays.find((d) => d.key === day.key);
      const label = day.label.trim();
      if (orig && label && orig.label !== label) {
        list.push({
          kind: "edit",
          summary: `Day header "${orig.label}" → "${label}"`,
          apply: () => apiPut(`/schedule/days/${day.key}`, { label }),
        });
      }
    }

    for (const ev of draftEvents) {
      if (!ev._new) continue;
      list.push({
        kind: "add",
        summary: `"${ev.label}"`,
        detail: `${dayLabel(ev.day)} · ${timeRange(ev)}`,
        apply: () =>
          apiPost("/schedule", {
            day: ev.day,
            start_hour: ev.startHour,
            end_hour: ev.endHour,
            label: ev.label,
            color: ev.color,
          }),
      });
    }

    for (const orig of serverEvents) {
      const draft = draftEvents.find((d) => d.id === orig.id);
      if (!draft) {
        list.push({
          kind: "delete",
          summary: `"${orig.label}"`,
          detail: `${dayLabel(orig.day)} · ${timeRange(orig)}`,
          apply: () => apiDelete(`/schedule/${orig.id}`),
        });
      } else if (!eventsEqual(orig, draft)) {
        const parts = [];
        if (orig.label !== draft.label)
          parts.push(`label "${orig.label}" → "${draft.label}"`);
        if (orig.day !== draft.day)
          parts.push(`${dayLabel(orig.day)} → ${dayLabel(draft.day)}`);
        if (
          orig.startHour !== draft.startHour ||
          orig.endHour !== draft.endHour
        )
          parts.push(`${timeRange(orig)} → ${timeRange(draft)}`);
        if (orig.color !== draft.color)
          parts.push(`color ${orig.color} → ${draft.color}`);
        list.push({
          kind: "edit",
          summary: `"${orig.label}"`,
          detail: parts.join(" · "),
          apply: () =>
            apiPut(`/schedule/${draft.id}`, {
              day: draft.day,
              start_hour: draft.startHour,
              end_hour: draft.endHour,
              label: draft.label,
              color: draft.color,
            }),
        });
      }
    }

    return list;

    function dayLabel(key) {
      return draftDays.find((d) => d.key === key)?.label ?? key;
    }
  }, [serverEvents, serverDays, draftEvents, draftDays]);

  useEffect(() => {
    onDirtyChange?.(changes.length);
  }, [changes.length, onDirtyChange]);

  /* ── Draft mutations ── */

  function upsertEvent(form) {
    if (form.id) {
      setDraftEvents((evs) =>
        evs.map((e) => (e.id === form.id ? { ...e, ...form } : e)),
      );
    } else {
      setDraftEvents((evs) => [
        ...evs,
        { ...form, id: `tmp-${++tmpIdRef.current}`, _new: true },
      ]);
    }
    setEditing(null);
  }

  function removeEvent(id) {
    setDraftEvents((evs) => evs.filter((e) => e.id !== id));
  }

  function discard() {
    setDraftEvents(serverEvents);
    setDraftDays(serverDays.map((d) => ({ ...d })));
  }

  async function applySave() {
    setSaving(true);
    setSaveError(null);
    let applied = 0;
    try {
      for (const change of changes) {
        await change.apply();
        applied += 1;
      }
      setReviewOpen(false);
      await load();
    } catch (err) {
      // Partial failure: resync with the server and drop the remaining draft
      // so the diff can't drift out of sync with reality.
      setSaveError(
        `Saved ${applied} of ${changes.length} changes, then failed: ${err.message}. Remaining changes were discarded — please re-apply them.`,
      );
      await load();
    } finally {
      setSaving(false);
    }
  }

  /* ── Preview data ── */

  const stagedStatus = useMemo(() => {
    const map = new Map();
    for (const ev of draftEvents) {
      if (ev._new) {
        map.set(ev.id, "new");
      } else {
        const orig = serverEvents.find((s) => s.id === ev.id);
        if (orig && !eventsEqual(orig, ev)) map.set(ev.id, "edited");
      }
    }
    return map;
  }, [draftEvents, serverEvents]);

  const dayEvents = draftEvents
    .filter((e) => e.day === activeDay)
    .sort((a, b) => a.startHour - b.startHour);

  const hourWindow = useMemo(() => {
    if (draftEvents.length === 0) return { minHour: 9, maxHour: 18 };
    return {
      minHour: Math.min(...draftEvents.map((e) => Math.floor(e.startHour))),
      maxHour: Math.max(...draftEvents.map((e) => Math.ceil(e.endHour))),
    };
  }, [draftEvents]);

  const activeDayLabel =
    draftDays.find((d) => d.key === activeDay)?.label ?? activeDay;
  const hasStaged = stagedStatus.size > 0;

  return (
    <div>
      {error && <p className="admin-error">{error}</p>}
      {saveError && !reviewOpen && <p className="admin-error">{saveError}</p>}

      {/* Day switcher — drives both the editor list and the preview */}
      <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Day">
        {draftDays.map((d) => (
          <button
            key={d.key}
            type="button"
            role="tab"
            aria-selected={activeDay === d.key}
            onClick={() => setActiveDay(d.key)}
            className={`font-mono text-xs uppercase tracking-wide px-4 py-1.5 rounded-pill border transition-colors duration-150 ease-brand ${
              activeDay === d.key
                ? "border-ultraviolet bg-ultraviolet/15 text-text-primary"
                : "border-border/40 text-text-secondary hover:border-ultraviolet/60 hover:text-text-primary"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        {/* ── Editor column ── */}
        <div className="flex flex-col gap-6">
          <Panel title="Day Headers">
            <div className="grid gap-3 sm:grid-cols-3">
              {draftDays.map((day) => {
                const orig = serverDays.find((d) => d.key === day.key);
                const changed = orig && orig.label !== day.label.trim();
                return (
                  <Field
                    key={day.key}
                    label={
                      <>
                        {day.key}
                        {changed && (
                          <span className="admin-chip admin-chip-edit ml-2">~</span>
                        )}
                      </>
                    }
                    htmlFor={`day-label-${day.key}`}
                  >
                    <input
                      id={`day-label-${day.key}`}
                      className="admin-input"
                      value={day.label}
                      onChange={(e) =>
                        setDraftDays((days) =>
                          days.map((d) =>
                            d.key === day.key
                              ? { ...d, label: e.target.value }
                              : d,
                          ),
                        )
                      }
                    />
                  </Field>
                );
              })}
            </div>
          </Panel>

          <Panel
            title="Events"
            count={dayEvents.length}
            actions={
              <button
                type="button"
                className="admin-btn-primary"
                onClick={() =>
                  setEditing({
                    day: activeDay,
                    startHour: 10,
                    endHour: 11,
                    label: "",
                    color: "violet",
                  })
                }
              >
                + New Event
              </button>
            }
          >
            {dayEvents.length === 0 ? (
              <EmptyState>No events on {activeDayLabel} yet.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-2">
                {dayEvents.map((ev) => {
                  const staged = stagedStatus.get(ev.id);
                  const color = EVENT_COLORS.find((c) => c.value === ev.color);
                  return (
                    <li
                      key={ev.id}
                      className="flex items-center gap-3 bg-black/20 border border-border/40 rounded-lg px-3 py-2 transition-colors duration-150 ease-brand hover:border-border/60"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-pill shrink-0"
                        style={{
                          background: color?.swatch ?? "var(--color-ultraviolet)",
                        }}
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm text-text-primary truncate">
                          {ev.label}
                        </p>
                        <p className="font-mono text-xs text-text-secondary">
                          {timeRange(ev)}
                        </p>
                      </div>
                      {staged === "new" && (
                        <span className="admin-chip admin-chip-add">new</span>
                      )}
                      {staged === "edited" && (
                        <span className="admin-chip admin-chip-edit">edited</span>
                      )}
                      <button
                        type="button"
                        className="admin-btn-icon"
                        aria-label={`Edit ${ev.label}`}
                        onClick={() => setEditing({ ...ev })}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="admin-btn-icon admin-btn-icon-danger"
                        aria-label={`Delete ${ev.label}`}
                        onClick={() => removeEvent(ev.id)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        {/* ── Live preview column ── */}
        <Panel title="Live Preview" className="lg:sticky lg:top-6">
          <p className="admin-help mb-3">
            How {activeDayLabel} will look after saving. Click an event to edit
            it.
          </p>
          <div className="schedule-grid-wrapper">
            <ScheduleGrid
              events={dayEvents}
              minHour={hourWindow.minHour}
              maxHour={hourWindow.maxHour}
              onEventClick={(ev) => setEditing({ ...ev })}
              eventClassName={(ev) => {
                const staged = stagedStatus.get(ev.id);
                if (staged === "new") return "ring-1 ring-cyber-teal/70";
                if (staged === "edited") return "ring-1 ring-signal-yellow/70";
                return "";
              }}
            />
          </div>
          {hasStaged && (
            <p className="admin-help mt-3 flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-pill bg-cyber-teal" aria-hidden="true" />
                unsaved new
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-pill bg-signal-yellow" aria-hidden="true" />
                unsaved edit
              </span>
            </p>
          )}
        </Panel>
      </div>

      <SaveBar
        count={changes.length}
        saving={saving}
        onSave={() => {
          setSaveError(null);
          setReviewOpen(true);
        }}
        onDiscard={discard}
      />

      <DiffModal
        open={reviewOpen}
        changes={changes}
        saving={saving}
        error={saveError}
        onConfirm={applySave}
        onClose={() => setReviewOpen(false)}
      />

      <EventModal
        open={editing !== null}
        initial={editing}
        days={draftDays}
        onSubmit={upsertEvent}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
