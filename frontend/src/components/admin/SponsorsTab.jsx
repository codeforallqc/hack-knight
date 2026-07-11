// Sponsors admin tab — reuses the companies table (same rows power team
// badges). A company becomes a public sponsor once it has a sponsor_tier;
// tiers are shown as separate drag-to-sort panels, plus an "Other
// Companies" panel for badge-only rows that aren't sponsors (yet).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  apiGet,
  apiPut,
  apiDelete,
  apiUpload,
  compressImage,
} from "../../lib/api";
import { Panel, Field, EmptyState, SaveBar, DiffModal, DragGrid, Modal } from "./ui";

const TIERS = [
  { value: "platinum", label: "Platinum" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "bronze", label: "Bronze" },
];

const EMPTY_SPONSOR = {
  name: "",
  sponsor_tier: "bronze",
  sponsor_url: "",
  sponsor_blurb: "",
  logo_url: null,
  _logoFile: null,
  _logoPreview: null,
};

function normalizeSponsor(c) {
  return {
    ...c,
    sponsor_tier: c.sponsor_tier ?? "",
    sponsor_url: c.sponsor_url ?? "",
    sponsor_blurb: c.sponsor_blurb ?? "",
  };
}

function sponsorFieldsEqual(a, b) {
  return (
    a.name === b.name &&
    a.sponsor_tier === b.sponsor_tier &&
    a.sponsor_url === b.sponsor_url &&
    a.sponsor_blurb === b.sponsor_blurb
  );
}

function tierLabel(tier) {
  return TIERS.find((t) => t.value === tier)?.label ?? tier;
}

function tierMembers(companies, tier) {
  return companies
    .filter((c) => c.sponsor_tier === tier)
    .slice()
    .sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name),
    );
}

/* ── Add / edit sponsor modal ── */

function SponsorModal({ open, initial, trackUrl, onSubmit, onClose }) {
  const [form, setForm] = useState(initial);
  const [formError, setFormError] = useState(null);
  const logoRef = useRef(null);

  // Reset the form when a new sponsor is opened — state adjustment during
  // render (not an effect) so the previous form persists through the
  // modal's exit animation.
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    if (initial) {
      setForm(initial);
      setFormError(null);
    }
  }

  if (!form) return null;
  const isNew = !form.id;

  function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    if (isNew && !form._logoFile) {
      setFormError("A logo is required");
      return;
    }
    onSubmit({
      ...form,
      name: form.name.trim(),
      sponsor_url: form.sponsor_url.trim(),
      sponsor_blurb: form.sponsor_blurb.trim(),
    });
  }

  return (
    <Modal
      open={open}
      title={isNew ? "Add Sponsor" : `Edit ${form.name}`}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Name" htmlFor="sponsor-name">
            <input
              id="sponsor-name"
              className="admin-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </Field>
          <Field label="Tier" htmlFor="sponsor-tier">
            <select
              id="sponsor-tier"
              className="admin-select"
              value={form.sponsor_tier}
              onChange={(e) => setForm({ ...form, sponsor_tier: e.target.value })}
            >
              <option value="">— Not a sponsor —</option>
              {TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Website URL" htmlFor="sponsor-url">
          <input
            id="sponsor-url"
            className="admin-input"
            type="url"
            placeholder="https://…"
            value={form.sponsor_url}
            onChange={(e) => setForm({ ...form, sponsor_url: e.target.value })}
          />
        </Field>

        <Field label="Blurb" htmlFor="sponsor-blurb">
          <textarea
            id="sponsor-blurb"
            className="admin-input min-h-24 resize-y"
            placeholder="Shown on the /sponsors page — optional"
            value={form.sponsor_blurb}
            onChange={(e) => setForm({ ...form, sponsor_blurb: e.target.value })}
          />
        </Field>

        <Field label={isNew ? "Logo (required)" : "Logo"}>
          <div className="flex items-center gap-3">
            {form._logoPreview ?? form.logo_url ? (
              <img
                src={form._logoPreview ?? form.logo_url}
                alt=""
                aria-hidden="true"
                className="w-14 h-14 object-contain bg-black/30 rounded-lg p-1.5"
              />
            ) : (
              <span className="font-mono text-xs text-text-muted">none</span>
            )}
            <button
              type="button"
              className="admin-btn-ghost"
              onClick={() => logoRef.current?.click()}
            >
              Choose…
            </button>
          </div>
          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setForm({ ...form, _logoFile: file, _logoPreview: trackUrl(file) });
              e.target.value = "";
            }}
          />
        </Field>

        {formError && <p className="admin-error">{formError}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" className="admin-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="admin-btn-primary">
            {isNew ? "Add Sponsor" : "Apply"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Tier panel ── */

function TierPanel({ tier, companies, onAdd, onEdit, onRemove, onReorder }) {
  const items = tierMembers(companies, tier);

  return (
    <Panel
      title={`${tierLabel(tier)} Sponsors`}
      count={items.length}
      actions={
        <button type="button" className="admin-btn-primary" onClick={() => onAdd(tier)}>
          + Add {tierLabel(tier)} Sponsor
        </button>
      }
    >
      {items.length === 0 ? (
        <EmptyState>No {tierLabel(tier).toLowerCase()} sponsors yet.</EmptyState>
      ) : (
        <DragGrid
          items={items}
          onReorder={onReorder}
          className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3"
          cardClassName={(c) => (c._new ? "admin-card-staged-new" : "")}
          renderItem={(c, idx, { move }) => (
            <div className="group relative p-3 flex flex-col items-center gap-2">
              <img
                src={c._logoPreview ?? c.logo_url}
                alt={`${c.name} logo`}
                className="w-full aspect-3/2 object-contain bg-black/30 rounded-lg p-2 pointer-events-none select-none"
                draggable={false}
              />
              <p className="font-body text-sm text-text-primary text-center truncate w-full">
                {c.name}
              </p>
              {c._new && <span className="admin-chip admin-chip-add">new</span>}

              <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150">
                <button
                  type="button"
                  className="admin-btn-icon"
                  aria-label={`Edit ${c.name}`}
                  title="Edit sponsor"
                  onClick={() => onEdit(c)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="admin-btn-icon admin-btn-icon-danger"
                  aria-label={`Delete ${c.name}`}
                  title="Delete sponsor"
                  onClick={() => onRemove(c.id)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150">
                <button
                  type="button"
                  className="admin-btn-icon"
                  aria-label={`Move ${c.name} earlier`}
                  disabled={idx === 0}
                  onClick={() => move(-1)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="admin-btn-icon"
                  aria-label={`Move ${c.name} later`}
                  disabled={idx === items.length - 1}
                  onClick={() => move(1)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        />
      )}
    </Panel>
  );
}

/* ── Other companies (badge-only, not a sponsor) ── */

function OtherCompaniesPanel({ companies, onEdit }) {
  const [open, setOpen] = useState(false);
  const items = companies
    .filter((c) => !c.sponsor_tier)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Panel
      title={
        <button
          type="button"
          className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-ultraviolet"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          Other Companies
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`transition-transform duration-150 ease-brand ${open ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      }
      count={items.length}
    >
      <p className="admin-help -mt-2 mb-3">
        Companies with a logo badge (from the Team tab) that aren't a public
        sponsor. Edit one to give it a tier.
      </p>
      {open &&
        (items.length === 0 ? (
          <EmptyState>Every company is currently a sponsor.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 bg-black/20 border border-border/40 rounded-lg px-3 py-2"
              >
                <img
                  src={c._logoPreview ?? c.logo_url}
                  alt={`${c.name} logo`}
                  className="w-9 h-9 object-contain bg-black/30 rounded-lg p-1 shrink-0"
                />
                <span className="font-body text-sm text-text-primary flex-1 truncate">
                  {c.name}
                </span>
                {c._new && <span className="admin-chip admin-chip-add">new</span>}
                <button
                  type="button"
                  className="admin-btn-icon"
                  aria-label={`Edit ${c.name}`}
                  title="Edit / make sponsor"
                  onClick={() => onEdit(c)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        ))}
    </Panel>
  );
}

/* ── Tab ── */

export default function SponsorsTab({ onDirtyChange }) {
  const [serverCompanies, setServerCompanies] = useState([]);
  const [draftCompanies, setDraftCompanies] = useState([]);
  const [editing, setEditing] = useState(null); // seed for SponsorModal
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [error, setError] = useState(null);
  const tmpIdRef = useRef(0);
  const objectUrlsRef = useRef(new Set());

  const trackUrl = useCallback((file) => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.add(url);
    return url;
  }, []);

  function revokeAllUrls() {
    for (const url of objectUrlsRef.current) URL.revokeObjectURL(url);
    objectUrlsRef.current.clear();
  }

  useEffect(() => revokeAllUrls, []);

  const load = useCallback(async () => {
    try {
      const companies = await apiGet("/companies");
      const normalized = companies.map(normalizeSponsor);
      setServerCompanies(normalized);
      setDraftCompanies(normalized.map((c) => ({ ...c })));
      revokeAllUrls();
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Staged diff ── */

  function tierReorderChanged(tier) {
    const draftIds = tierMembers(draftCompanies, tier)
      .filter((c) => !c._new)
      .map((c) => c.id);
    const serverIds = tierMembers(serverCompanies, tier)
      .map((c) => c.id)
      .filter((id) => draftIds.includes(id));
    return draftIds.join(",") !== serverIds.join(",");
  }

  const changes = useMemo(() => {
    const list = [];

    for (const c of draftCompanies) {
      if (c._new) {
        list.push({
          kind: "add",
          summary: `Sponsor "${c.name}"`,
          detail: c.sponsor_tier ? tierLabel(c.sponsor_tier) : "No tier assigned",
        });
        continue;
      }
      const orig = serverCompanies.find((s) => s.id === c.id);
      if (!orig) continue;
      const parts = [];
      if (orig.name !== c.name) parts.push(`name "${orig.name}" → "${c.name}"`);
      if (orig.sponsor_tier !== c.sponsor_tier)
        parts.push(
          `tier ${orig.sponsor_tier ? tierLabel(orig.sponsor_tier) : "none"} → ${
            c.sponsor_tier ? tierLabel(c.sponsor_tier) : "none"
          }`,
        );
      if (orig.sponsor_url !== c.sponsor_url) parts.push("website URL");
      if (orig.sponsor_blurb !== c.sponsor_blurb) parts.push("blurb");
      if (c._logoFile) parts.push("new logo");
      if (parts.length) {
        list.push({ kind: "edit", summary: `"${orig.name}"`, detail: parts.join(" · ") });
      }
    }

    for (const orig of serverCompanies) {
      if (!draftCompanies.some((c) => c.id === orig.id)) {
        list.push({
          kind: "delete",
          summary: `"${orig.name}"`,
          detail: "Also removes its badge from any team member wearing it",
        });
      }
    }

    for (const t of TIERS) {
      if (tierReorderChanged(t.value)) {
        list.push({ kind: "reorder", summary: `${t.label} sponsor order` });
      }
    }

    return list;
    // tierReorderChanged closes over draftCompanies/serverCompanies directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftCompanies, serverCompanies]);

  useEffect(() => {
    onDirtyChange?.(changes.length);
  }, [changes.length, onDirtyChange]);

  /* ── Draft mutations ── */

  function openAdd(tier) {
    setEditing({ ...EMPTY_SPONSOR, sponsor_tier: tier });
  }

  function upsertSponsor(form) {
    if (form.id) {
      setDraftCompanies((companies) =>
        companies.map((c) => (c.id === form.id ? { ...c, ...form } : c)),
      );
    } else {
      const sortOrder = form.sponsor_tier
        ? tierMembers(draftCompanies, form.sponsor_tier).length
        : 0;
      setDraftCompanies((companies) => [
        ...companies,
        {
          ...form,
          id: `tmp-sponsor-${++tmpIdRef.current}`,
          sort_order: sortOrder,
          _new: true,
        },
      ]);
    }
    setEditing(null);
  }

  function removeSponsor(id) {
    setDraftCompanies((companies) => companies.filter((c) => c.id !== id));
  }

  function reorderTier(tier, nextItems) {
    setDraftCompanies((companies) =>
      companies.map((c) => {
        const idx = nextItems.findIndex((n) => n.id === c.id);
        return idx === -1 ? c : { ...c, sort_order: idx };
      }),
    );
  }

  function discard() {
    setDraftCompanies(serverCompanies.map((c) => ({ ...c })));
    setError(null);
    revokeAllUrls();
  }

  /* ── Apply ── */

  async function applySave() {
    setSaving(true);
    setSaveError(null);
    try {
      // 1. Create new sponsors (tmp id → real id).
      const idMap = new Map();
      for (const c of draftCompanies) {
        if (!c._new) continue;
        const formData = new FormData();
        formData.append("name", c.name);
        formData.append("sponsor_tier", c.sponsor_tier || "");
        formData.append("sponsor_url", c.sponsor_url || "");
        formData.append("sponsor_blurb", c.sponsor_blurb || "");
        const compressed = await compressImage(c._logoFile);
        formData.append("logo", compressed, c._logoFile.name);
        const created = await apiUpload("/companies", formData);
        idMap.set(c.id, created.id);
      }

      // 2. Update edited sponsors.
      for (const c of draftCompanies) {
        if (c._new) continue;
        const orig = serverCompanies.find((s) => s.id === c.id);
        if (!orig) continue;
        if (sponsorFieldsEqual(orig, c) && !c._logoFile) continue;
        const formData = new FormData();
        if (orig.name !== c.name) formData.append("name", c.name);
        if (orig.sponsor_tier !== c.sponsor_tier)
          formData.append("sponsor_tier", c.sponsor_tier || "");
        if (orig.sponsor_url !== c.sponsor_url)
          formData.append("sponsor_url", c.sponsor_url || "");
        if (orig.sponsor_blurb !== c.sponsor_blurb)
          formData.append("sponsor_blurb", c.sponsor_blurb || "");
        if (c._logoFile) {
          const compressed = await compressImage(c._logoFile);
          formData.append("logo", compressed, c._logoFile.name);
        }
        await apiUpload(`/companies/${c.id}`, formData, "PUT");
      }

      // 3. Delete removed sponsors.
      for (const orig of serverCompanies) {
        if (!draftCompanies.some((c) => c.id === orig.id)) {
          await apiDelete(`/companies/${orig.id}`);
        }
      }

      // 4. Persist tier display order for every tiered sponsor (new + existing).
      const order = TIERS.flatMap((t) =>
        tierMembers(draftCompanies, t.value).map((c, idx) => ({
          id: idMap.get(c.id) ?? c.id,
          sort_order: idx,
        })),
      );
      if (order.length > 0) {
        await apiPut("/companies/reorder", { order });
      }

      setReviewOpen(false);
      await load();
    } catch (err) {
      setSaveError(
        `Save failed partway: ${err.message}. Sponsors were reloaded — review what applied and re-stage the rest.`,
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

      {TIERS.map((t) => (
        <TierPanel
          key={t.value}
          tier={t.value}
          companies={draftCompanies}
          onAdd={openAdd}
          onEdit={setEditing}
          onRemove={removeSponsor}
          onReorder={(next) => reorderTier(t.value, next)}
        />
      ))}

      <OtherCompaniesPanel companies={draftCompanies} onEdit={setEditing} />

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

      <SponsorModal
        open={editing !== null}
        initial={editing}
        trackUrl={trackUrl}
        onSubmit={upsertSponsor}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
