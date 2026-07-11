// Shared admin UI kit — panels, fields, save bar, diff modal, drag grid.
// Visual spec: MASTER.md §7. Motion: fast/dry per the interaction thesis —
// fades and small translates only, 150–250ms, ease-brand.

import { useEffect, useRef, useState } from "react";
import { motion as Motion, AnimatePresence } from "motion/react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "./icons";

const EASE_BRAND = [0.4, 0, 0.2, 1];

/** Move an array item and return a new array. */
function arrayMove(arr, from, to) {
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/* ── Panel ─────────────────────────────────────────── */

export function Panel({ title, count, actions, children, className = "" }) {
  return (
    <section className={`admin-panel ${className}`}>
      {(title || actions) && (
        <div className="admin-panel-head">
          <div className="flex items-center gap-2.5">
            {title && <h2 className="admin-panel-title">{title}</h2>}
            {count != null && <span className="admin-count-pill">{count}</span>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

/* ── Field ─────────────────────────────────────────── */

export function Field({ label, htmlFor, children, className = "" }) {
  return (
    <div className={className}>
      <label className="admin-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function EmptyState({ children }) {
  return <div className="admin-empty">{children}</div>;
}

/* ── Toggle switch ─────────────────────────────────── */

export function Toggle({ id, checked, onChange, label }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill border
        transition-colors duration-150 ease-brand
        focus-visible:outline-2 focus-visible:outline-ultraviolet focus-visible:outline-offset-2
        ${
          checked
            ? "bg-ultraviolet border-ultraviolet"
            : "bg-black/30 border-border/40 hover:border-border/60"
        }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-4 w-4 rounded-pill bg-text-primary
          transition-transform duration-150 ease-brand
          ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

/* ── Collapsible panel title ───────────────────────── */

/** Panel `title` that toggles an open/closed section (chevron flips). */
export function CollapseTitle({ open, onToggle, children }) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-ultraviolet"
      onClick={onToggle}
      aria-expanded={open}
    >
      {children}
      <ChevronDownIcon
        size={14}
        className={`transition-transform duration-150 ease-brand ${open ? "rotate-180" : ""}`}
      />
    </button>
  );
}

/* ── Card overlays (inside a `group` drag card) ────── */

/** Hover/focus-revealed action cluster pinned to a card corner. */
export function CardOverlay({ corner = "top", children }) {
  return (
    <div
      className={`absolute ${corner === "top" ? "top-1.5" : "bottom-1.5"} right-1.5 flex gap-1
        opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
        transition-opacity duration-150`}
    >
      {children}
    </div>
  );
}

/** Keyboard-accessible reorder buttons for a DragGrid card. */
export function CardMoveButtons({ label, index, total, move }) {
  return (
    <CardOverlay corner="bottom">
      <button
        type="button"
        className="admin-btn-icon"
        aria-label={`Move ${label} earlier`}
        disabled={index === 0}
        onClick={() => move(-1)}
      >
        <ChevronLeftIcon />
      </button>
      <button
        type="button"
        className="admin-btn-icon"
        aria-label={`Move ${label} later`}
        disabled={index === total - 1}
        onClick={() => move(1)}
      >
        <ChevronRightIcon />
      </button>
    </CardOverlay>
  );
}

/* ── Scaled preview ────────────────────────────────── */

/**
 * Shrink-to-fit wrapper for live previews. Public components size
 * themselves to the viewport, so inside a half-width admin panel they can
 * be wider than the space available — this measures the content's natural
 * width and scales it down (never up) to fit without horizontal scrolling.
 * Keep the wrapper itself padding-free so the measurements stay honest.
 */
export function ScaledPreview({ children, className = "" }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [box, setBox] = useState({ scale: 1, height: null });

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    function measure() {
      const available = outer.clientWidth;
      const natural = inner.offsetWidth;
      if (!available || !natural) return;
      const scale = Math.min(1, available / natural);
      const height = Math.round(inner.offsetHeight * scale);
      setBox((b) => (b.scale === scale && b.height === height ? b : { scale, height }));
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className={`overflow-hidden ${className}`}
      style={{ height: box.height ?? undefined }}
    >
      <div
        ref={innerRef}
        className="w-max mx-auto flow-root"
        style={{ transform: `scale(${box.scale})`, transformOrigin: "top left" }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Save bar ──────────────────────────────────────── */

export function SaveBar({ count, saving, onSave, onDiscard }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <Motion.div
          key="savebar"
          className="admin-savebar"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE_BRAND }}
        >
          <span className="admin-savebar-count">
            {count} unsaved change{count === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="admin-btn-ghost"
              onClick={onDiscard}
              disabled={saving}
            >
              Discard
            </button>
            <button
              type="button"
              className="admin-btn-primary"
              onClick={onSave}
              disabled={saving}
            >
              Save Changes
            </button>
          </div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Modal ─────────────────────────────────────────── */

export function Modal({ open, title, onClose, wide = false, children }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          key="backdrop"
          className="admin-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE_BRAND }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <Motion.div
            className={`admin-modal ${wide ? "admin-modal-wide" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_BRAND }}
          >
            {title && <h3 className="admin-modal-title">{title}</h3>}
            {children}
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Diff modal ────────────────────────────────────── */

const CHANGE_KINDS = {
  add: { label: "+ Add", chip: "admin-chip-add" },
  edit: { label: "~ Edit", chip: "admin-chip-edit" },
  replace: { label: "~ Replace", chip: "admin-chip-edit" },
  delete: { label: "− Delete", chip: "admin-chip-delete" },
  reorder: { label: "⇅ Reorder", chip: "admin-chip-reorder" },
};

/**
 * Review-before-save modal. `changes` is a list of
 * { kind: 'add'|'edit'|'replace'|'delete'|'reorder', summary, detail? }.
 */
export function DiffModal({ open, changes, saving, error, onConfirm, onClose }) {
  return (
    <Modal open={open} title="Review changes" onClose={saving ? () => {} : onClose}>
      <ul className="flex flex-col gap-2 mb-5">
        {changes.map((change, i) => {
          const kind = CHANGE_KINDS[change.kind] ?? CHANGE_KINDS.edit;
          return (
            <li
              key={i}
              className="flex items-start gap-3 bg-black/20 border border-border/40 rounded-lg px-3 py-2"
            >
              <span className={`admin-chip ${kind.chip} mt-0.5`}>{kind.label}</span>
              <div className="min-w-0">
                <p className="font-body text-sm text-text-primary">{change.summary}</p>
                {change.detail && (
                  <p className="font-body text-xs text-text-secondary mt-0.5">
                    {change.detail}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {error && <p className="admin-error">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="admin-btn-ghost"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="button"
          className="admin-btn-primary"
          onClick={onConfirm}
          disabled={saving}
        >
          {saving ? "Saving…" : `Confirm & Save (${changes.length})`}
        </button>
      </div>
    </Modal>
  );
}

/* ── Drag grid ─────────────────────────────────────── */

/**
 * Grid with HTML5 drag-to-reorder. The outer plain div owns the native drag
 * events (motion components swallow onDragStart/onDragEnd for their own
 * gesture system); the inner motion.div animates the shuffle via `layout`.
 *
 * renderItem(item, index, { isDragging, move }) — `move(delta)` is the
 * keyboard-accessible fallback for reordering without a pointer.
 */
export function DragGrid({
  items,
  onReorder,
  renderItem,
  keyOf = (item) => item.id,
  className = "",
  cardClassName = () => "",
}) {
  const [dragKey, setDragKey] = useState(null);

  function moveTo(from, to) {
    if (from === to || from < 0 || to < 0 || to >= items.length) return;
    onReorder(arrayMove(items, from, to));
  }

  return (
    <div className={className}>
      {items.map((item, idx) => {
        const key = keyOf(item);
        const isDragging = dragKey === key;
        return (
          <div
            key={key}
            draggable
            onDragStart={(e) => {
              setDragKey(key);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragEnd={() => setDragKey(null)}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragKey == null || dragKey === key) return;
              const from = items.findIndex((it) => keyOf(it) === dragKey);
              if (from !== -1) moveTo(from, idx);
            }}
            onDrop={(e) => e.preventDefault()}
          >
            <Motion.div
              layout
              transition={{ duration: 0.2, ease: EASE_BRAND }}
              className={`admin-drag-card ${
                isDragging ? "admin-drag-card-active" : ""
              } ${cardClassName(item)}`}
            >
              {renderItem(item, idx, {
                isDragging,
                move: (delta) => moveTo(idx, idx + delta),
              })}
            </Motion.div>
          </div>
        );
      })}
    </div>
  );
}
