// Schedule admin tab — staged editor + live preview.
// Nothing touches the server until the diff modal is confirmed: edits to
// day headers and events accumulate in draft state, the preview renders
// the draft through the same ScheduleGrid the public site uses.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../../../lib/api";
import ScheduleGrid from "../../site/ScheduleGrid";
import { Panel, Field, EmptyState, SaveBar, DiffModal } from "../ui";
import { PencilIcon, XIcon } from "../icons";
import EventModal from "./EventModal";
import { EVENT_COLORS, mapEvent, eventsEqual, timeRange } from "./scheduleMeta";

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
                        <PencilIcon size={14} />
                      </button>
                      <button
                        type="button"
                        className="admin-btn-icon admin-btn-icon-danger"
                        aria-label={`Delete ${ev.label}`}
                        onClick={() => removeEvent(ev.id)}
                      >
                        <XIcon size={14} />
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
