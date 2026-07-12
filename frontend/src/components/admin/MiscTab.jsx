// Misc admin tab — one-off site settings that don't warrant their own tab.
// Countdown target date (staged + previewed live through the real public
// CountdownTimer component) and the MLH trust badge toggle.

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiPut } from "../../lib/api";
import { MLH_BADGE_SRC, MLH_BADGE_ALT } from "../../lib/mlh";
import CountdownTimer from "../site/CountdownTimer";
import { Panel, Field, SaveBar, DiffModal, Toggle, ScaledPreview } from "./ui";

const COUNTDOWN_KEY = "countdown_target";
const MLH_KEY = "mlh_badge_enabled";

// "2026-10-09T00:00:00" -> { date: "2026-10-09", time: "00:00" }
function splitDateTime(value) {
  const [date, time] = value.split("T");
  return { date: date ?? "", time: (time ?? "00:00:00").slice(0, 5) };
}

function joinDateTime(date, time) {
  return `${date}T${time || "00:00"}:00`;
}

function formatDisplay(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function MiscTab({ onDirtyChange }) {
  const [serverSettings, setServerSettings] = useState(null);
  const [draftSettings, setDraftSettings] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const settings = await apiGet("/settings");
      setServerSettings(settings);
      setDraftSettings({ ...settings });
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function setDraft(key, value) {
    setDraftSettings((s) => ({ ...s, [key]: value }));
  }

  const changes = useMemo(() => {
    if (!serverSettings || !draftSettings) return [];
    const list = [];

    if (draftSettings[COUNTDOWN_KEY] !== serverSettings[COUNTDOWN_KEY]) {
      list.push({
        kind: "edit",
        summary: "Countdown target date",
        detail: `${formatDisplay(serverSettings[COUNTDOWN_KEY])} → ${formatDisplay(
          draftSettings[COUNTDOWN_KEY],
        )}`,
        apply: () =>
          apiPut(`/settings/${COUNTDOWN_KEY}`, {
            value: draftSettings[COUNTDOWN_KEY],
          }),
      });
    }

    if (draftSettings[MLH_KEY] !== serverSettings[MLH_KEY]) {
      const on = draftSettings[MLH_KEY] === "true";
      list.push({
        kind: "edit",
        summary: "MLH trust badge",
        detail: on
          ? "Hidden → shown on the public site"
          : "Shown → hidden on the public site",
        apply: () =>
          apiPut(`/settings/${MLH_KEY}`, { value: draftSettings[MLH_KEY] }),
      });
    }

    return list;
  }, [serverSettings, draftSettings]);

  useEffect(() => {
    onDirtyChange?.(changes.length);
  }, [changes.length, onDirtyChange]);

  function discard() {
    setDraftSettings({ ...serverSettings });
  }

  async function applySave() {
    setSaving(true);
    setSaveError(null);
    try {
      for (const change of changes) await change.apply();
      setReviewOpen(false);
      await load();
    } catch (err) {
      setSaveError(`Save failed: ${err.message}. Please try again.`);
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (draftSettings === null) {
    return error ? <p className="admin-error">{error}</p> : null;
  }

  const countdownValue = draftSettings[COUNTDOWN_KEY] ?? "";
  const { date, time } = splitDateTime(countdownValue);
  const mlhOn = draftSettings[MLH_KEY] === "true";

  return (
    <div>
      {error && <p className="admin-error">{error}</p>}
      {saveError && !reviewOpen && <p className="admin-error">{saveError}</p>}

      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <div className="flex flex-col gap-6">
          <Panel title="Countdown Timer">
            <p className="admin-help mb-4">
              The date and time the homepage countdown counts down to.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Event Date" htmlFor="countdown-date">
                <input
                  id="countdown-date"
                  type="date"
                  className="admin-input"
                  value={date}
                  onChange={(e) =>
                    setDraft(COUNTDOWN_KEY, joinDateTime(e.target.value, time))
                  }
                />
              </Field>
              <Field label="Event Time" htmlFor="countdown-time">
                <input
                  id="countdown-time"
                  type="time"
                  className="admin-input"
                  value={time}
                  onChange={(e) =>
                    setDraft(COUNTDOWN_KEY, joinDateTime(date, e.target.value))
                  }
                />
              </Field>
            </div>
          </Panel>

          <Panel title="MLH Trust Badge">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <label
                  className="admin-label mb-0.5 cursor-pointer"
                  htmlFor="mlh-badge-toggle"
                >
                  Show badge
                </label>
                <p className="admin-help">
                  Pins the official MLH trust badge to the top-left of the
                  public site. Turn on once MLH approves the badge.
                </p>
              </div>
              <Toggle
                id="mlh-badge-toggle"
                label="Show MLH trust badge"
                checked={mlhOn}
                onChange={(next) => setDraft(MLH_KEY, next ? "true" : "false")}
              />
            </div>
          </Panel>
        </div>

        <Panel title="Live Preview" className="lg:sticky lg:top-6">
          <p className="admin-help mb-3">
            How the countdown will look after saving.
          </p>
          <div className="bg-black/20 border border-border/40 rounded-xl py-6 px-4">
            {/* The public timer sizes itself to the viewport, so it can be
                wider than this half-width panel — scale it down to fit. */}
            <ScaledPreview>
              <CountdownTimer targetDate={countdownValue} />
            </ScaledPreview>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <img
              src={MLH_BADGE_SRC}
              alt={MLH_BADGE_ALT}
              className={`w-14 shrink-0 transition-all duration-300 ease-brand
                ${mlhOn ? "" : "grayscale opacity-35"}`}
            />
            <p className="admin-help">
              MLH badge {mlhOn ? "shown" : "hidden"} on the public site
            </p>
          </div>
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
    </div>
  );
}
