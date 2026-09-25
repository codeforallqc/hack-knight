// Judges admin tab — TeamTab's staged-draft pattern minus the companies
// panel and character badges, plus the reveal toggle: until judges_revealed
// is on, the public section shows "To Be Announced!". Company badges are
// assigned from the shared companies list managed in the Team tab.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  apiGet,
  apiPut,
  apiDelete,
  apiUpload,
  compressImage,
} from "../../../lib/api";
import {
  Panel,
  EmptyState,
  SaveBar,
  DiffModal,
  DragGrid,
  CardOverlay,
  CardMoveButtons,
  Toggle,
  type Change,
} from "../ui";
import { PencilIcon, XIcon } from "../icons";
import { useObjectUrls } from "../useObjectUrls";
import type { SiteSettings } from "../../../types";
import type { AdminCompany, AdminJudge, JudgeForm, RawJudge } from "../adminTypes";
import { EMPTY_JUDGE, normalizeJudge, judgeFieldsEqual } from "./judgeUtils";
import JudgeModal from "./JudgeModal";

const REVEALED_KEY = "judges_revealed";

export default function JudgesTab({ onDirtyChange }: { onDirtyChange?: (count: number) => void }) {
  const [serverJudges, setServerJudges] = useState<AdminJudge[]>([]);
  const [draftJudges, setDraftJudges] = useState<AdminJudge[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  // site_settings value strings ("true"/"false"); absent key = hidden.
  const [serverRevealed, setServerRevealed] = useState<string | undefined>();
  const [draftRevealed, setDraftRevealed] = useState<string | undefined>();
  const [editing, setEditing] = useState<JudgeForm | null>(null); // seed for JudgeModal
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tmpIdRef = useRef(0);
  const { trackUrl, revokeAll } = useObjectUrls();

  const load = useCallback(async () => {
    try {
      const [judges, companyList, settings] = await Promise.all([
        apiGet<RawJudge[]>("/judges"),
        apiGet<AdminCompany[]>("/companies"),
        apiGet<SiteSettings>("/settings"),
      ]);
      const normalized = judges.map(normalizeJudge);
      setServerJudges(normalized);
      setDraftJudges(normalized.map((j) => ({ ...j })));
      setCompanies(companyList);
      setServerRevealed(settings[REVEALED_KEY]);
      setDraftRevealed(settings[REVEALED_KEY]);
      revokeAll();
    } catch (err) {
      setError((err as Error).message);
    }
  }, [revokeAll]);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Staged diff ── */

  const companyName = useCallback(
    (id: string) => companies.find((c) => c.id === id)?.name ?? "None",
    [companies],
  );

  function describeBadges(j: AdminJudge | JudgeForm) {
    const names = [j.company1_id, j.company2_id]
      .filter(Boolean)
      .map(companyName);
    return names.length ? names.join(" + ") : "none";
  }

  const orderChanged = useMemo(() => {
    const draftIds = draftJudges.filter((j) => !j._new).map((j) => j.id);
    const serverIds = serverJudges
      .map((j) => j.id)
      .filter((id) => draftIds.includes(id));
    if (draftIds.join(",") !== serverIds.join(",")) return true;
    const firstNewIdx = draftJudges.findIndex((j) => j._new);
    return (
      firstNewIdx !== -1 && draftJudges.slice(firstNewIdx).some((j) => !j._new)
    );
  }, [draftJudges, serverJudges]);

  const changes = useMemo(() => {
    const list: Change[] = [];

    if (draftRevealed !== serverRevealed) {
      const on = draftRevealed === "true";
      list.push({
        kind: "edit",
        summary: "Judges reveal",
        detail: on
          ? '"To Be Announced!" → judges shown on the homepage'
          : 'Judges → "To Be Announced!" on the homepage',
      });
    }

    for (const j of draftJudges) {
      if (j._new) {
        list.push({
          kind: "add",
          summary: `Judge ${j.name}`,
          detail: `${j.title} · badges: ${describeBadges(j)}`,
        });
      }
    }

    for (const orig of serverJudges) {
      const draft = draftJudges.find((d) => d.id === orig.id);
      if (!draft) {
        list.push({
          kind: "delete",
          summary: `Judge ${orig.name}`,
          detail: orig.title,
        });
        continue;
      }
      const parts: string[] = [];
      if (orig.name !== draft.name)
        parts.push(`name "${orig.name}" → "${draft.name}"`);
      if (orig.title !== draft.title)
        parts.push(`title "${orig.title}" → "${draft.title}"`);
      if (
        orig.company1_id !== draft.company1_id ||
        orig.company2_id !== draft.company2_id
      )
        parts.push(`badges ${describeBadges(orig)} → ${describeBadges(draft)}`);
      if (draft._photoFile) parts.push("new photo");
      if (parts.length) {
        list.push({
          kind: "edit",
          summary: `Judge ${orig.name}`,
          detail: parts.join(" · "),
        });
      }
    }

    if (orderChanged) {
      list.push({
        kind: "reorder",
        summary: "Judges display priority",
        detail: draftJudges.map((j, i) => `${i + 1}. ${j.name}`).join(" · "),
      });
    }

    return list;
    // describeBadges depends on companyName (memoized on companies).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftJudges, serverJudges, draftRevealed, serverRevealed, orderChanged, companyName]);

  useEffect(() => {
    onDirtyChange?.(changes.length);
  }, [changes.length, onDirtyChange]);

  /* ── Draft mutations ── */

  function upsertJudge(form: JudgeForm) {
    if (form.id) {
      setDraftJudges((judges) =>
        judges.map((j) => (j.id === form.id ? { ...j, ...form, id: j.id } : j)),
      );
    } else {
      setDraftJudges((judges) => [
        ...judges,
        { ...form, id: `tmp-judge-${++tmpIdRef.current}`, _new: true },
      ]);
    }
    setEditing(null);
  }

  function removeJudge(id: string) {
    setDraftJudges((judges) => judges.filter((j) => j.id !== id));
  }

  function discard() {
    setDraftJudges(serverJudges.map((j) => ({ ...j })));
    setDraftRevealed(serverRevealed);
    setError(null);
    revokeAll();
  }

  /* ── Apply ── */

  async function applySave() {
    setSaving(true);
    setSaveError(null);
    try {
      // 1. The reveal toggle.
      if (draftRevealed !== serverRevealed && draftRevealed !== undefined) {
        await apiPut(`/settings/${REVEALED_KEY}`, { value: draftRevealed });
      }

      // 2. Delete removed judges.
      for (const orig of serverJudges) {
        if (!draftJudges.some((d) => d.id === orig.id)) {
          await apiDelete(`/judges/${orig.id}`);
        }
      }

      // 3. Update edited judges.
      for (const j of draftJudges) {
        if (j._new) continue;
        const orig = serverJudges.find((s) => s.id === j.id);
        if (!orig) continue;
        if (judgeFieldsEqual(orig, j) && !j._photoFile) continue;
        const formData = new FormData();
        formData.append("name", j.name);
        formData.append("title", j.title);
        formData.append("company1_id", j.company1_id);
        formData.append("company2_id", j.company2_id);
        if (j._photoFile) {
          const compressed = await compressImage(j._photoFile);
          formData.append("photo", compressed);
        }
        await apiUpload(`/judges/${j.id}`, formData, "PUT");
      }

      // 4. Create new judges with their draft position as priority.
      for (let i = 0; i < draftJudges.length; i++) {
        const j = draftJudges[i];
        if (!j._new) continue;
        const formData = new FormData();
        formData.append("name", j.name);
        formData.append("title", j.title);
        formData.append("company1_id", j.company1_id);
        formData.append("company2_id", j.company2_id);
        formData.append("sort_order", String(i));
        const compressedPhoto = await compressImage(j._photoFile!);
        formData.append("photo", compressedPhoto);
        await apiUpload("/judges", formData);
      }

      // 5. Persist the drag order for existing judges.
      if (orderChanged) {
        const order = draftJudges
          .map((j, idx) => ({ id: j.id, sort_order: idx }))
          .filter((o) => !o.id.startsWith("tmp-"));
        if (order.length > 0) {
          await apiPut("/judges/reorder", { order });
        }
      }

      setReviewOpen(false);
      await load();
    } catch (err) {
      setSaveError(
        `Save failed partway: ${(err as Error).message}. The judges were reloaded — review what applied and re-stage the rest.`,
      );
      setReviewOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  /* ── Render ── */

  const judgeCompanies = (j: AdminJudge) =>
    [j.company1_id, j.company2_id]
      .filter(Boolean)
      .map((id) => companies.find((c) => c.id === id))
      .filter((c): c is AdminCompany => Boolean(c));

  const revealedOn = draftRevealed === "true";

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="admin-error">{error}</p>}
      {saveError && <p className="admin-error">{saveError}</p>}

      <Panel title="Visibility">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <label
              className="admin-label mb-0.5 cursor-pointer"
              htmlFor="judges-revealed-toggle"
            >
              Reveal judges
            </label>
            <p className="admin-help">
              When off (or while there are no judges), the homepage section
              shows &quot;To Be Announced!&quot;. Turn on once the lineup is
              ready.
            </p>
          </div>
          <Toggle
            id="judges-revealed-toggle"
            label="Reveal judges"
            checked={revealedOn}
            onChange={(next) => setDraftRevealed(next ? "true" : "false")}
          />
        </div>
      </Panel>

      <Panel
        title="Judges"
        count={draftJudges.length}
        actions={
          <button
            type="button"
            className="admin-btn-primary"
            onClick={() => setEditing({ ...EMPTY_JUDGE })}
          >
            + Add Judge
          </button>
        }
      >
        <p className="admin-help mb-4">
          Drag cards to set display priority — #1 shows first on the site.
          Company badges come from the Team tab&apos;s Companies panel.
        </p>

        {draftJudges.length === 0 ? (
          <EmptyState>No judges yet — the site shows &quot;To Be Announced!&quot;.</EmptyState>
        ) : (
          <DragGrid
            items={draftJudges}
            onReorder={setDraftJudges}
            className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3"
            cardClassName={(j) => {
              if (j._new) return "admin-card-staged-new";
              const orig = serverJudges.find((s) => s.id === j.id);
              if (orig && (!judgeFieldsEqual(orig, j) || j._photoFile))
                return "admin-card-staged-edit";
              return "";
            }}
            renderItem={(j, idx, { move }) => {
              const orig = serverJudges.find((s) => s.id === j.id);
              const edited =
                !j._new && orig && (!judgeFieldsEqual(orig, j) || j._photoFile);
              return (
                <div className="group relative p-2 flex flex-col gap-1.5">
                  <div className="relative">
                    <img
                      src={j._photoPreview ?? j.photo_url ?? undefined}
                      alt={j.name}
                      className="w-full aspect-square object-cover rounded-lg pointer-events-none select-none"
                      draggable={false}
                    />
                    <span className="admin-count-pill absolute top-1.5 left-1.5 bg-black/70">
                      #{idx + 1}
                    </span>

                    <CardOverlay>
                      <button
                        type="button"
                        className="admin-btn-icon"
                        aria-label={`Edit ${j.name}`}
                        title="Edit judge"
                        onClick={() => setEditing({ ...j })}
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        className="admin-btn-icon admin-btn-icon-danger"
                        aria-label={`Delete ${j.name}`}
                        title="Delete judge"
                        onClick={() => removeJudge(j.id)}
                      >
                        <XIcon />
                      </button>
                    </CardOverlay>

                    <CardMoveButtons
                      label={j.name}
                      index={idx}
                      total={draftJudges.length}
                      move={move}
                    />
                  </div>

                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-sm text-text-primary truncate">
                        {j.name}
                      </p>
                      <p className="font-body text-xs text-ultraviolet truncate">
                        {j.title}
                      </p>
                    </div>
                    {j._new && <span className="admin-chip admin-chip-add">new</span>}
                    {edited && <span className="admin-chip admin-chip-edit">edited</span>}
                  </div>

                  {judgeCompanies(j).length > 0 && (
                    <div className="flex items-center gap-1.5">
                      {judgeCompanies(j).map((c) => (
                        <img
                          key={c.id}
                          src={c.logo_url ?? undefined}
                          alt={`${c.name} badge`}
                          title={c.name}
                          className="w-5 h-5 object-contain bg-black/30 rounded p-0.5"
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            }}
          />
        )}
      </Panel>

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

      <JudgeModal
        open={editing !== null}
        initial={editing}
        companies={companies}
        trackUrl={trackUrl}
        onSubmit={upsertJudge}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
