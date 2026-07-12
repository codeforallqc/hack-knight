// One gallery year — its drag-to-sort photo grid plus the upload drop zone.
// All photo actions are staged: this panel only reports intents upward.

import { useRef, useState } from "react";
import { Panel, EmptyState, DragGrid, CardOverlay, CardMoveButtons } from "../ui";
import { ReplaceIcon, XIcon } from "../icons";

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

      <CardOverlay>
        <button
          type="button"
          className="admin-btn-icon"
          aria-label="Replace photo"
          title="Replace photo"
          onClick={onReplace}
        >
          <ReplaceIcon />
        </button>
        <button
          type="button"
          className="admin-btn-icon admin-btn-icon-danger"
          aria-label="Delete photo"
          title="Delete photo"
          onClick={onRemove}
        >
          <XIcon />
        </button>
      </CardOverlay>

      <CardMoveButtons label="photo" index={index} total={total} move={move} />

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

export default function YearPanel({
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
