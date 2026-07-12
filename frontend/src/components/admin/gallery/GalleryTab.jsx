// Gallery admin tab — years and their photos, fully staged.
// Photos reorder by dragging cards; uploads, replacements, and deletes are
// all held locally (object-URL previews) until the diff modal is confirmed.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiUpload,
  compressImage,
} from "../../../lib/api";
import { Panel, Field, EmptyState, SaveBar, DiffModal } from "../ui";
import { useObjectUrls } from "../useObjectUrls";
import YearPanel from "./YearPanel";

function cloneYears(years) {
  return years.map((y) => ({ ...y, photos: (y.photos ?? []).map((p) => ({ ...p })) }));
}

export default function GalleryTab({ onDirtyChange }) {
  const [serverYears, setServerYears] = useState([]);
  const [draftYears, setDraftYears] = useState([]);
  const [newYear, setNewYear] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [error, setError] = useState(null);
  const tmpIdRef = useRef(0);
  const { trackUrl, revokeAll } = useObjectUrls();

  const load = useCallback(async () => {
    try {
      const data = await apiGet("/gallery");
      setServerYears(data);
      setDraftYears(cloneYears(data));
      revokeAll();
    } catch (err) {
      setError(err.message);
    }
  }, [revokeAll]);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Staged diff (presentational; applySave orchestrates the real ops) ── */

  function needsReorder(draftYear, serverYear) {
    if (!serverYear) return false; // new year uploads already land in draft order
    const persistedDraft = draftYear.photos.filter((p) => !p._new).map((p) => p.id);
    const serverKept = serverYear.photos
      .map((p) => p.id)
      .filter((id) => persistedDraft.includes(id));
    if (persistedDraft.join(",") !== serverKept.join(",")) return true;
    // New photos anywhere except strictly at the tail also force a reorder.
    const firstNewIdx = draftYear.photos.findIndex((p) => p._new);
    return (
      firstNewIdx !== -1 && draftYear.photos.slice(firstNewIdx).some((p) => !p._new)
    );
  }

  const changes = useMemo(() => {
    const list = [];

    for (const y of draftYears) {
      if (y._new) {
        list.push({ kind: "add", summary: `Year ${y.year}` });
      }
    }

    for (const sy of serverYears) {
      if (!draftYears.some((d) => d.id === sy.id)) {
        list.push({
          kind: "delete",
          summary: `Year ${sy.year}`,
          detail: `Permanently deletes its ${sy.photos.length} photo${
            sy.photos.length === 1 ? "" : "s"
          }`,
        });
      }
    }

    for (const y of draftYears) {
      const serverYear = serverYears.find((s) => s.id === y.id);

      const uploads = y.photos.filter((p) => p._new);
      if (uploads.length > 0) {
        list.push({
          kind: "add",
          summary: `${uploads.length} photo${uploads.length === 1 ? "" : "s"} to ${y.year}`,
          detail: uploads.map((p) => p._file.name).join(", "),
        });
      }

      const replaces = y.photos.filter((p) => !p._new && p._replaceFile);
      if (replaces.length > 0) {
        list.push({
          kind: "replace",
          summary: `${replaces.length} photo${replaces.length === 1 ? "" : "s"} in ${y.year}`,
          detail: replaces.map((p) => p._replaceFile.name).join(", "),
        });
      }

      if (serverYear) {
        const removed = serverYear.photos.filter(
          (sp) => !y.photos.some((p) => p.id === sp.id),
        );
        if (removed.length > 0) {
          list.push({
            kind: "delete",
            summary: `${removed.length} photo${removed.length === 1 ? "" : "s"} from ${y.year}`,
          });
        }
      }

      if (needsReorder(y, serverYear)) {
        list.push({ kind: "reorder", summary: `Photo order in ${y.year}` });
      }
    }

    return list;
  }, [draftYears, serverYears]);

  useEffect(() => {
    onDirtyChange?.(changes.length);
  }, [changes.length, onDirtyChange]);

  /* ── Draft mutations ── */

  function addYear(e) {
    e.preventDefault();
    const value = newYear.trim();
    if (!value) return;
    if (draftYears.some((y) => y.year === value)) {
      setError(`Year ${value} already exists`);
      return;
    }
    setError(null);
    setDraftYears((years) => [
      ...years,
      { id: `tmp-year-${++tmpIdRef.current}`, year: value, photos: [], _new: true },
    ]);
    setNewYear("");
  }

  function removeYear(id) {
    setDraftYears((years) => years.filter((y) => y.id !== id));
  }

  function stagePhotos(yearId, fileList) {
    const staged = Array.from(fileList).map((file) => ({
      id: `tmp-photo-${++tmpIdRef.current}`,
      src: trackUrl(file),
      alt: file.name,
      _new: true,
      _file: file,
    }));
    setDraftYears((years) =>
      years.map((y) =>
        y.id === yearId ? { ...y, photos: [...y.photos, ...staged] } : y,
      ),
    );
  }

  function removePhoto(yearId, photoId) {
    setDraftYears((years) =>
      years.map((y) =>
        y.id === yearId
          ? { ...y, photos: y.photos.filter((p) => p.id !== photoId) }
          : y,
      ),
    );
  }

  function replacePhoto(yearId, photoId, file) {
    const preview = trackUrl(file);
    setDraftYears((years) =>
      years.map((y) =>
        y.id === yearId
          ? {
              ...y,
              photos: y.photos.map((p) => {
                if (p.id !== photoId) return p;
                if (p._new) return { ...p, src: preview, alt: file.name, _file: file };
                return { ...p, _replaceFile: file, _replacePreview: preview };
              }),
            }
          : y,
      ),
    );
  }

  function reorderPhotos(yearId, nextPhotos) {
    setDraftYears((years) =>
      years.map((y) => (y.id === yearId ? { ...y, photos: nextPhotos } : y)),
    );
  }

  function discard() {
    setDraftYears(cloneYears(serverYears));
    setNewYear("");
    setError(null);
    revokeAll();
  }

  /* ── Apply ── */

  async function applySave() {
    setSaving(true);
    setSaveError(null);
    try {
      // 1. Create new years (tmp id → real id).
      const yearIdMap = new Map();
      for (const y of draftYears) {
        if (!y._new) continue;
        const created = await apiPost("/gallery/years", { year: y.year });
        yearIdMap.set(y.id, created.id);
      }

      // 2. Delete years removed from the draft (cascades their photos).
      for (const sy of serverYears) {
        if (!draftYears.some((d) => d.id === sy.id)) {
          await apiDelete(`/gallery/years/${sy.id}`);
        }
      }

      // 3. Per-year photo operations.
      for (const y of draftYears) {
        const realYearId = yearIdMap.get(y.id) ?? y.id;
        const serverYear = serverYears.find((s) => s.id === y.id);

        if (serverYear) {
          for (const sp of serverYear.photos) {
            if (!y.photos.some((p) => p.id === sp.id)) {
              await apiDelete(`/gallery/photos/${sp.id}`);
            }
          }
        }

        for (const p of y.photos) {
          if (!p._new && p._replaceFile) {
            const formData = new FormData();
            const compressed = await compressImage(p._replaceFile);
            formData.append("photo", compressed, p._replaceFile.name);
            await apiUpload(`/gallery/photos/${p.id}/replace`, formData, "PUT");
          }
        }

        // Upload staged photos in draft order; the response rows come back in
        // the same order, giving us the real ids for the final reorder.
        const newPhotos = y.photos.filter((p) => p._new);
        const createdIds = new Map();
        if (newPhotos.length > 0) {
          const formData = new FormData();
          for (const p of newPhotos) {
            const compressed = await compressImage(p._file);
            formData.append("photos", compressed, p._file.name);
          }
          const created = await apiUpload(
            `/gallery/years/${realYearId}/photos`,
            formData,
          );
          created.forEach((row, i) => createdIds.set(newPhotos[i].id, row.id));
        }

        if (needsReorder(y, serverYear)) {
          const order = y.photos.map((p, idx) => ({
            id: createdIds.get(p.id) ?? p.id,
            sort_order: idx,
          }));
          await apiPut("/gallery/photos/reorder", { order });
        }
      }

      setReviewOpen(false);
      await load();
    } catch (err) {
      setSaveError(
        `Save failed partway: ${err.message}. The gallery was reloaded — review what applied and re-stage the rest.`,
      );
      setReviewOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="admin-error">{error}</p>}
      {saveError && <p className="admin-error">{saveError}</p>}

      <Panel title="Add Year">
        <form onSubmit={addYear} className="flex items-end gap-3 flex-wrap">
          <Field label="Year" htmlFor="new-year" className="w-40">
            <input
              id="new-year"
              className="admin-input"
              placeholder="e.g. 2026"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
            />
          </Field>
          <button type="submit" className="admin-btn-primary">
            Add Year
          </button>
        </form>
      </Panel>

      {draftYears.length === 0 && (
        <EmptyState>No gallery years yet — add the first one above.</EmptyState>
      )}

      {draftYears.map((year) => (
        <YearPanel
          key={year.id}
          year={year}
          onRemoveYear={removeYear}
          onStagePhotos={stagePhotos}
          onRemovePhoto={removePhoto}
          onReplacePhoto={replacePhoto}
          onReorder={reorderPhotos}
        />
      ))}

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
