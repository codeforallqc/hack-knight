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
} from "../../lib/api";
import { Panel, Field, EmptyState, SaveBar, DiffModal, DragGrid } from "./ui";

function cloneYears(years) {
  return years.map((y) => ({ ...y, photos: (y.photos ?? []).map((p) => ({ ...p })) }));
}

/* ── Photo card (inside DragGrid) ── */

function PhotoCard({ photo, onReplace, onRemove, move, index, total }) {
  return (
    <div className="group relative">
      <img
        src={photo._replacePreview ?? photo.src}
        alt={photo.alt}
        className="w-full aspect-square object-cover rounded-xl pointer-events-none select-none"
        draggable={false}
      />

      {/* Action overlay */}
      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150">
        <button
          type="button"
          className="admin-btn-icon"
          aria-label="Replace photo"
          title="Replace photo"
          onClick={onReplace}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
          </svg>
        </button>
        <button
          type="button"
          className="admin-btn-icon admin-btn-icon-danger"
          aria-label="Delete photo"
          title="Delete photo"
          onClick={onRemove}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Keyboard-accessible reorder */}
      <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150">
        <button
          type="button"
          className="admin-btn-icon"
          aria-label="Move photo earlier"
          disabled={index === 0}
          onClick={() => move(-1)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          className="admin-btn-icon"
          aria-label="Move photo later"
          disabled={index === total - 1}
          onClick={() => move(1)}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      {/* Staged markers */}
      {photo._new && (
        <span className="admin-chip admin-chip-add absolute bottom-1.5 left-1.5">new</span>
      )}
      {photo._replaceFile && !photo._new && (
        <span className="admin-chip admin-chip-edit absolute bottom-1.5 left-1.5">replaced</span>
      )}
    </div>
  );
}

/* ── Year panel ── */

function YearPanel({
  year,
  onRemoveYear,
  onStagePhotos,
  onRemovePhoto,
  onReplacePhoto,
  onReorder,
}) {
  const uploadRef = useRef(null);
  const replaceRef = useRef(null);
  const replaceTargetRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <Panel
      title={year.year}
      count={`${year.photos.length} photo${year.photos.length === 1 ? "" : "s"}`}
      actions={
        <div className="flex items-center gap-2">
          {year._new && <span className="admin-chip admin-chip-add">new year</span>}
          <button
            type="button"
            className="admin-btn-danger"
            onClick={() => onRemoveYear(year.id)}
          >
            Delete Year
          </button>
        </div>
      }
    >
      {year.photos.length === 0 ? (
        <EmptyState>No photos yet — add some below.</EmptyState>
      ) : (
        <DragGrid
          items={year.photos}
          onReorder={(next) => onReorder(year.id, next)}
          className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3"
          cardClassName={(p) =>
            p._new
              ? "admin-card-staged-new"
              : p._replaceFile
                ? "admin-card-staged-edit"
                : ""
          }
          renderItem={(photo, idx, { move }) => (
            <PhotoCard
              photo={photo}
              index={idx}
              total={year.photos.length}
              move={move}
              onRemove={() => onRemovePhoto(year.id, photo.id)}
              onReplace={() => {
                replaceTargetRef.current = photo.id;
                replaceRef.current?.click();
              }}
            />
          )}
        />
      )}

      <p className="admin-help mt-3">
        Drag photos to change their order — first photo shows first on the site.
      </p>

      {/* Upload drop zone */}
      <div
        className={`mt-3 border border-dashed rounded-xl px-4 py-5 text-center transition-colors duration-150 ease-brand ${
          dragOver ? "border-ultraviolet/60 bg-ultraviolet/5" : "border-border/40"
        }`}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) onStagePhotos(year.id, e.dataTransfer.files);
        }}
      >
        <p className="font-mono text-xs uppercase tracking-widest text-text-muted mb-2">
          Drop images here
        </p>
        <button
          type="button"
          className="admin-btn-ghost"
          onClick={() => uploadRef.current?.click()}
        >
          Browse Files
        </button>
      </div>

      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onStagePhotos(year.id, e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={replaceRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && replaceTargetRef.current) {
            onReplacePhoto(year.id, replaceTargetRef.current, file);
          }
          replaceTargetRef.current = null;
          e.target.value = "";
        }}
      />
    </Panel>
  );
}

/* ── Tab ── */

export default function GalleryTab({ onDirtyChange }) {
  const [serverYears, setServerYears] = useState([]);
  const [draftYears, setDraftYears] = useState([]);
  const [newYear, setNewYear] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [error, setError] = useState(null);
  const tmpIdRef = useRef(0);
  const objectUrlsRef = useRef(new Set());

  function trackUrl(file) {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.add(url);
    return url;
  }

  function revokeAllUrls() {
    for (const url of objectUrlsRef.current) URL.revokeObjectURL(url);
    objectUrlsRef.current.clear();
  }

  useEffect(() => revokeAllUrls, []);

  const load = useCallback(async () => {
    try {
      const data = await apiGet("/gallery");
      setServerYears(data);
      setDraftYears(cloneYears(data));
      revokeAllUrls();
    } catch (err) {
      setError(err.message);
    }
  }, []);

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
    revokeAllUrls();
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
