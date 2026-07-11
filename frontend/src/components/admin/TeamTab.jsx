// Team admin tab — drag card order = display priority, staged until save.
// Includes the Companies panel: reusable logo badges (max 2 per member)
// that render before the social icons on the public team section.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  apiGet,
  apiPut,
  apiDelete,
  apiUpload,
  compressImage,
} from "../../lib/api";
import { Panel, Field, EmptyState, SaveBar, DiffModal, DragGrid, Modal } from "./ui";

const EMPTY_MEMBER = {
  name: "",
  title: "",
  linkedin_url: "",
  github_url: "",
  company1_id: "",
  company2_id: "",
  photo_url: null,
  badge_url: null,
  _photoFile: null,
  _photoPreview: null,
  _badgeFile: null,
  _badgePreview: null,
};

function normalizeMember(m) {
  return {
    ...m,
    linkedin_url: m.linkedin_url ?? "",
    github_url: m.github_url ?? "",
    company1_id: m.company1_id ?? "",
    company2_id: m.company2_id ?? "",
  };
}

function memberFieldsEqual(a, b) {
  return (
    a.name === b.name &&
    a.title === b.title &&
    a.linkedin_url === b.linkedin_url &&
    a.github_url === b.github_url &&
    a.company1_id === b.company1_id &&
    a.company2_id === b.company2_id
  );
}

/* ── File picker button with thumbnail preview ── */

function FilePick({ label, preview, previewClass, onFile, hint }) {
  const inputRef = useRef(null);
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        {preview ? (
          <img
            src={preview}
            alt=""
            aria-hidden="true"
            className={previewClass}
          />
        ) : (
          <span className="font-mono text-xs text-text-muted">none</span>
        )}
        <button
          type="button"
          className="admin-btn-ghost"
          onClick={() => inputRef.current?.click()}
        >
          Choose…
        </button>
        {hint && <span className="admin-help">{hint}</span>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </Field>
  );
}

/* ── Add / edit member modal ── */

function MemberModal({ open, initial, companies, trackUrl, onSubmit, onClose }) {
  const [form, setForm] = useState(initial);
  const [formError, setFormError] = useState(null);

  // Reset the form when a new member is opened — state adjustment during
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
    if (!form.name.trim() || !form.title.trim()) {
      setFormError("Name and title are required");
      return;
    }
    if (isNew && !form._photoFile) {
      setFormError("A profile photo is required");
      return;
    }
    if (
      form.company1_id &&
      form.company2_id &&
      form.company1_id === form.company2_id
    ) {
      setFormError("Pick two different companies (or just one)");
      return;
    }
    onSubmit({ ...form, name: form.name.trim(), title: form.title.trim() });
  }

  function companyOptions(excludeId) {
    return companies.filter((c) => c.id !== excludeId);
  }

  return (
    <Modal
      open={open}
      title={isNew ? "Add Member" : `Edit ${form.name}`}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Name" htmlFor="member-name">
            <input
              id="member-name"
              className="admin-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </Field>
          <Field label="Title" htmlFor="member-title">
            <input
              id="member-title"
              className="admin-input"
              placeholder="e.g. Tech Lead"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="LinkedIn URL" htmlFor="member-linkedin">
            <input
              id="member-linkedin"
              className="admin-input"
              type="url"
              placeholder="https://linkedin.com/in/…"
              value={form.linkedin_url}
              onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
            />
          </Field>
          <Field label="GitHub URL" htmlFor="member-github">
            <input
              id="member-github"
              className="admin-input"
              type="url"
              placeholder="https://github.com/…"
              value={form.github_url}
              onChange={(e) => setForm({ ...form, github_url: e.target.value })}
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Company Badge 1" htmlFor="member-company1">
            <select
              id="member-company1"
              className="admin-select"
              value={form.company1_id}
              onChange={(e) => setForm({ ...form, company1_id: e.target.value })}
            >
              <option value="">— None —</option>
              {companyOptions(form.company2_id).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Company Badge 2" htmlFor="member-company2">
            <select
              id="member-company2"
              className="admin-select"
              value={form.company2_id}
              onChange={(e) => setForm({ ...form, company2_id: e.target.value })}
            >
              <option value="">— None —</option>
              {companyOptions(form.company1_id).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p className="admin-help -mt-2">
          Company logos show before the social icons on the public site;
          badge 1 comes first.
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <FilePick
            label={isNew ? "Profile Photo (required)" : "Profile Photo"}
            preview={form._photoPreview ?? form.photo_url}
            previewClass="w-14 h-14 rounded-lg object-cover"
            onFile={(file) =>
              setForm({ ...form, _photoFile: file, _photoPreview: trackUrl(file) })
            }
          />
          <FilePick
            label="Character Badge"
            preview={form._badgePreview ?? form.badge_url}
            previewClass="w-14 h-14 rounded-lg object-contain bg-black/30"
            onFile={(file) =>
              setForm({ ...form, _badgeFile: file, _badgePreview: trackUrl(file) })
            }
            hint="Shown on card flip"
          />
        </div>

        {formError && <p className="admin-error">{formError}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" className="admin-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="admin-btn-primary">
            {isNew ? "Add Member" : "Apply"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Companies panel ── */

function CompaniesPanel({
  companies,
  wearerCount,
  serverCompanies,
  onAdd,
  onRename,
  onReplaceLogo,
  onRemove,
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [addError, setAddError] = useState(null);
  const logoRef = useRef(null);
  const replaceRef = useRef(null);
  const replaceTargetRef = useRef(null);

  function submitAdd(e) {
    e.preventDefault();
    const value = name.trim();
    if (!value || !logoFile) {
      setAddError("A name and a logo are both required");
      return;
    }
    if (companies.some((c) => c.name.toLowerCase() === value.toLowerCase())) {
      setAddError(`"${value}" already exists`);
      return;
    }
    setAddError(null);
    onAdd(value, logoFile, logoPreview);
    setName("");
    setLogoFile(null);
    setLogoPreview(null);
  }

  return (
    <Panel
      title={
        <button
          type="button"
          className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-ultraviolet"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          Companies
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
      count={companies.length}
    >
      <p className="admin-help -mt-2 mb-3">
        Reusable logo badges — assign up to two per member from the edit dialog.
      </p>

      {open && (
        <div className="flex flex-col gap-3">
          {companies.length === 0 ? (
            <EmptyState>No companies yet — add the first one below.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {companies.map((company) => {
                const orig = serverCompanies.find((c) => c.id === company.id);
                const renamed = orig && orig.name !== company.name;
                const worn = wearerCount(company.id);
                return (
                  <li
                    key={company.id}
                    className="flex items-center gap-3 bg-black/20 border border-border/40 rounded-lg px-3 py-2"
                  >
                    <img
                      src={company._logoPreview ?? company.logo_url}
                      alt={`${company.name} logo`}
                      className="w-9 h-9 object-contain bg-black/30 rounded-lg p-1 shrink-0"
                    />
                    <input
                      className="admin-input max-w-48"
                      aria-label={`Company name for ${company.name}`}
                      value={company.name}
                      onChange={(e) => onRename(company.id, e.target.value)}
                    />
                    <span className="font-mono text-xs text-text-muted flex-1">
                      {worn > 0
                        ? `worn by ${worn} member${worn === 1 ? "" : "s"}`
                        : "unused"}
                    </span>
                    {company._new && (
                      <span className="admin-chip admin-chip-add">new</span>
                    )}
                    {!company._new && (renamed || company._logoFile) && (
                      <span className="admin-chip admin-chip-edit">edited</span>
                    )}
                    <button
                      type="button"
                      className="admin-btn-icon"
                      aria-label={`Replace ${company.name} logo`}
                      title="Replace logo"
                      onClick={() => {
                        replaceTargetRef.current = company.id;
                        replaceRef.current?.click();
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="admin-btn-icon admin-btn-icon-danger"
                      aria-label={`Delete ${company.name}`}
                      title="Delete company"
                      onClick={() => onRemove(company.id)}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <form onSubmit={submitAdd} className="flex items-end gap-3 flex-wrap">
            <Field label="New Company" htmlFor="company-name" className="w-48">
              <input
                id="company-name"
                className="admin-input"
                placeholder="e.g. Google"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <button
              type="button"
              className="admin-btn-ghost"
              onClick={() => logoRef.current?.click()}
            >
              {logoFile ? "Logo ✓" : "Choose Logo…"}
            </button>
            {logoPreview && (
              <img
                src={logoPreview}
                alt="New company logo preview"
                className="w-9 h-9 object-contain bg-black/30 rounded-lg p-1"
              />
            )}
            <button type="submit" className="admin-btn-primary">
              Add Company
            </button>
          </form>
          {addError && <p className="admin-error mb-0">{addError}</p>}

          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setLogoFile(file);
                setLogoPreview(URL.createObjectURL(file));
              }
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
                onReplaceLogo(replaceTargetRef.current, file);
              }
              replaceTargetRef.current = null;
              e.target.value = "";
            }}
          />
        </div>
      )}
    </Panel>
  );
}

/* ── Tab ── */

export default function TeamTab({ onDirtyChange }) {
  const [serverMembers, setServerMembers] = useState([]);
  const [serverCompanies, setServerCompanies] = useState([]);
  const [draftMembers, setDraftMembers] = useState([]);
  const [draftCompanies, setDraftCompanies] = useState([]);
  const [editing, setEditing] = useState(null); // seed for MemberModal
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
      const [members, companies] = await Promise.all([
        apiGet("/team"),
        apiGet("/companies"),
      ]);
      const normalized = members.map(normalizeMember);
      setServerMembers(normalized);
      setServerCompanies(companies);
      setDraftMembers(normalized.map((m) => ({ ...m })));
      setDraftCompanies(companies.map((c) => ({ ...c })));
      revokeAllUrls();
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Staged diff ── */

  const companyName = useCallback(
    (id) => draftCompanies.find((c) => c.id === id)?.name ?? "None",
    [draftCompanies],
  );

  function describeBadges(m) {
    const names = [m.company1_id, m.company2_id]
      .filter(Boolean)
      .map(companyName);
    return names.length ? names.join(" + ") : "none";
  }

  const orderChanged = useMemo(() => {
    const draftIds = draftMembers.filter((m) => !m._new).map((m) => m.id);
    const serverIds = serverMembers
      .map((m) => m.id)
      .filter((id) => draftIds.includes(id));
    if (draftIds.join(",") !== serverIds.join(",")) return true;
    const firstNewIdx = draftMembers.findIndex((m) => m._new);
    return (
      firstNewIdx !== -1 && draftMembers.slice(firstNewIdx).some((m) => !m._new)
    );
  }, [draftMembers, serverMembers]);

  const changes = useMemo(() => {
    const list = [];

    for (const c of draftCompanies) {
      if (c._new) {
        list.push({ kind: "add", summary: `Company "${c.name}"` });
        continue;
      }
      const orig = serverCompanies.find((s) => s.id === c.id);
      if (!orig) continue;
      const parts = [];
      if (orig.name !== c.name) parts.push(`name "${orig.name}" → "${c.name}"`);
      if (c._logoFile) parts.push("new logo");
      if (parts.length) {
        list.push({
          kind: "edit",
          summary: `Company "${orig.name}"`,
          detail: parts.join(" · "),
        });
      }
    }

    for (const orig of serverCompanies) {
      if (!draftCompanies.some((c) => c.id === orig.id)) {
        list.push({
          kind: "delete",
          summary: `Company "${orig.name}"`,
          detail: "Removes its badge from every member wearing it",
        });
      }
    }

    for (const m of draftMembers) {
      if (m._new) {
        list.push({
          kind: "add",
          summary: `Member ${m.name}`,
          detail: `${m.title} · badges: ${describeBadges(m)}`,
        });
      }
    }

    for (const orig of serverMembers) {
      const draft = draftMembers.find((d) => d.id === orig.id);
      if (!draft) {
        list.push({
          kind: "delete",
          summary: `Member ${orig.name}`,
          detail: orig.title,
        });
        continue;
      }
      const parts = [];
      if (orig.name !== draft.name)
        parts.push(`name "${orig.name}" → "${draft.name}"`);
      if (orig.title !== draft.title)
        parts.push(`title "${orig.title}" → "${draft.title}"`);
      if (orig.linkedin_url !== draft.linkedin_url) parts.push("LinkedIn URL");
      if (orig.github_url !== draft.github_url) parts.push("GitHub URL");
      if (
        orig.company1_id !== draft.company1_id ||
        orig.company2_id !== draft.company2_id
      )
        parts.push(`badges ${describeBadges(orig)} → ${describeBadges(draft)}`);
      if (draft._photoFile) parts.push("new photo");
      if (draft._badgeFile) parts.push("new character badge");
      if (parts.length) {
        list.push({
          kind: "edit",
          summary: `Member ${orig.name}`,
          detail: parts.join(" · "),
        });
      }
    }

    if (orderChanged) {
      list.push({
        kind: "reorder",
        summary: "Team display priority",
        detail: draftMembers.map((m, i) => `${i + 1}. ${m.name}`).join(" · "),
      });
    }

    return list;
    // describeBadges depends on companyName (memoized on draftCompanies).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftMembers, draftCompanies, serverMembers, serverCompanies, orderChanged, companyName]);

  useEffect(() => {
    onDirtyChange?.(changes.length);
  }, [changes.length, onDirtyChange]);

  /* ── Draft mutations ── */

  function upsertMember(form) {
    if (form.id) {
      setDraftMembers((members) =>
        members.map((m) => (m.id === form.id ? { ...m, ...form } : m)),
      );
    } else {
      setDraftMembers((members) => [
        ...members,
        { ...form, id: `tmp-member-${++tmpIdRef.current}`, _new: true },
      ]);
    }
    setEditing(null);
  }

  function removeMember(id) {
    setDraftMembers((members) => members.filter((m) => m.id !== id));
  }

  function addCompany(name, logoFile, logoPreview) {
    objectUrlsRef.current.add(logoPreview);
    setDraftCompanies((companies) => [
      ...companies,
      {
        id: `tmp-company-${++tmpIdRef.current}`,
        name,
        logo_url: null,
        _new: true,
        _logoFile: logoFile,
        _logoPreview: logoPreview,
      },
    ]);
  }

  function renameCompany(id, name) {
    setDraftCompanies((companies) =>
      companies.map((c) => (c.id === id ? { ...c, name } : c)),
    );
  }

  function replaceCompanyLogo(id, file) {
    const preview = trackUrl(file);
    setDraftCompanies((companies) =>
      companies.map((c) =>
        c.id === id ? { ...c, _logoFile: file, _logoPreview: preview } : c,
      ),
    );
  }

  function removeCompany(id) {
    setDraftCompanies((companies) => companies.filter((c) => c.id !== id));
    // Detach the badge from any member wearing it in the draft.
    setDraftMembers((members) =>
      members.map((m) => ({
        ...m,
        company1_id: m.company1_id === id ? "" : m.company1_id,
        company2_id: m.company2_id === id ? "" : m.company2_id,
      })),
    );
  }

  function wearerCount(companyId) {
    return draftMembers.filter(
      (m) => m.company1_id === companyId || m.company2_id === companyId,
    ).length;
  }

  function discard() {
    setDraftMembers(serverMembers.map((m) => ({ ...m })));
    setDraftCompanies(serverCompanies.map((c) => ({ ...c })));
    setError(null);
    revokeAllUrls();
  }

  /* ── Apply ── */

  async function applySave() {
    setSaving(true);
    setSaveError(null);
    try {
      // 1. Create new companies (tmp id → real id).
      const companyIdMap = new Map();
      for (const c of draftCompanies) {
        if (!c._new) continue;
        const formData = new FormData();
        formData.append("name", c.name);
        const compressed = await compressImage(c._logoFile);
        formData.append("logo", compressed, c._logoFile.name);
        const created = await apiUpload("/companies", formData);
        companyIdMap.set(c.id, created.id);
      }
      const resolveCompany = (id) => (id ? (companyIdMap.get(id) ?? id) : "");

      // 2. Update edited companies.
      for (const c of draftCompanies) {
        if (c._new) continue;
        const orig = serverCompanies.find((s) => s.id === c.id);
        if (!orig) continue;
        if (orig.name === c.name && !c._logoFile) continue;
        const formData = new FormData();
        formData.append("name", c.name);
        if (c._logoFile) {
          const compressed = await compressImage(c._logoFile);
          formData.append("logo", compressed, c._logoFile.name);
        }
        await apiUpload(`/companies/${c.id}`, formData, "PUT");
      }

      // 3. Delete removed members.
      for (const orig of serverMembers) {
        if (!draftMembers.some((d) => d.id === orig.id)) {
          await apiDelete(`/team/${orig.id}`);
        }
      }

      // 4. Update edited members.
      for (const m of draftMembers) {
        if (m._new) continue;
        const orig = serverMembers.find((s) => s.id === m.id);
        if (!orig) continue;
        if (memberFieldsEqual(orig, m) && !m._photoFile && !m._badgeFile) continue;
        const formData = new FormData();
        formData.append("name", m.name);
        formData.append("title", m.title);
        formData.append("linkedin_url", m.linkedin_url);
        formData.append("github_url", m.github_url);
        formData.append("company1_id", resolveCompany(m.company1_id));
        formData.append("company2_id", resolveCompany(m.company2_id));
        if (m._photoFile) {
          const compressed = await compressImage(m._photoFile);
          formData.append("photo", compressed, m._photoFile.name);
        }
        if (m._badgeFile) {
          const compressed = await compressImage(m._badgeFile);
          formData.append("badge", compressed, m._badgeFile.name);
        }
        await apiUpload(`/team/${m.id}`, formData, "PUT");
      }

      // 5. Create new members with their draft position as priority.
      for (let i = 0; i < draftMembers.length; i++) {
        const m = draftMembers[i];
        if (!m._new) continue;
        const formData = new FormData();
        formData.append("name", m.name);
        formData.append("title", m.title);
        formData.append("linkedin_url", m.linkedin_url);
        formData.append("github_url", m.github_url);
        formData.append("company1_id", resolveCompany(m.company1_id));
        formData.append("company2_id", resolveCompany(m.company2_id));
        formData.append("sort_order", String(i));
        const compressedPhoto = await compressImage(m._photoFile);
        formData.append("photo", compressedPhoto, m._photoFile.name);
        if (m._badgeFile) {
          const compressedBadge = await compressImage(m._badgeFile);
          formData.append("badge", compressedBadge, m._badgeFile.name);
        }
        await apiUpload("/team", formData);
      }

      // 6. Persist the drag order for existing members.
      if (orderChanged) {
        const order = draftMembers
          .map((m, idx) => ({ id: m.id, sort_order: idx }))
          .filter((o) => !o.id.startsWith("tmp-"));
        if (order.length > 0) {
          await apiPut("/team/reorder", { order });
        }
      }

      // 7. Delete removed companies last (badges detach via FK SET NULL).
      for (const orig of serverCompanies) {
        if (!draftCompanies.some((c) => c.id === orig.id)) {
          await apiDelete(`/companies/${orig.id}`);
        }
      }

      setReviewOpen(false);
      await load();
    } catch (err) {
      setSaveError(
        `Save failed partway: ${err.message}. The team was reloaded — review what applied and re-stage the rest.`,
      );
      setReviewOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  /* ── Render ── */

  const memberCompanies = (m) =>
    [m.company1_id, m.company2_id]
      .filter(Boolean)
      .map((id) => draftCompanies.find((c) => c.id === id))
      .filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="admin-error">{error}</p>}
      {saveError && <p className="admin-error">{saveError}</p>}

      <CompaniesPanel
        companies={draftCompanies}
        serverCompanies={serverCompanies}
        wearerCount={wearerCount}
        onAdd={addCompany}
        onRename={renameCompany}
        onReplaceLogo={replaceCompanyLogo}
        onRemove={removeCompany}
      />

      <Panel
        title="Members"
        count={draftMembers.length}
        actions={
          <button
            type="button"
            className="admin-btn-primary"
            onClick={() => setEditing({ ...EMPTY_MEMBER })}
          >
            + Add Member
          </button>
        }
      >
        <p className="admin-help mb-4">
          Drag cards to set display priority — #1 shows first on the site.
        </p>

        {draftMembers.length === 0 ? (
          <EmptyState>No team members yet.</EmptyState>
        ) : (
          <DragGrid
            items={draftMembers}
            onReorder={setDraftMembers}
            className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3"
            cardClassName={(m) => {
              if (m._new) return "admin-card-staged-new";
              const orig = serverMembers.find((s) => s.id === m.id);
              if (orig && (!memberFieldsEqual(orig, m) || m._photoFile || m._badgeFile))
                return "admin-card-staged-edit";
              return "";
            }}
            renderItem={(m, idx, { move }) => {
              const orig = serverMembers.find((s) => s.id === m.id);
              const edited =
                !m._new &&
                orig &&
                (!memberFieldsEqual(orig, m) || m._photoFile || m._badgeFile);
              return (
                <div className="group relative p-2 flex flex-col gap-1.5">
                  <div className="relative">
                    <img
                      src={m._photoPreview ?? m.photo_url}
                      alt={m.name}
                      className="w-full aspect-square object-cover rounded-lg pointer-events-none select-none"
                      draggable={false}
                    />
                    <span className="admin-count-pill absolute top-1.5 left-1.5 bg-black/70">
                      #{idx + 1}
                    </span>

                    <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150">
                      <button
                        type="button"
                        className="admin-btn-icon"
                        aria-label={`Edit ${m.name}`}
                        title="Edit member"
                        onClick={() => setEditing({ ...m })}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="admin-btn-icon admin-btn-icon-danger"
                        aria-label={`Delete ${m.name}`}
                        title="Delete member"
                        onClick={() => removeMember(m.id)}
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
                        aria-label={`Move ${m.name} earlier`}
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
                        aria-label={`Move ${m.name} later`}
                        disabled={idx === draftMembers.length - 1}
                        onClick={() => move(1)}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-sm text-text-primary truncate">
                        {m.name}
                      </p>
                      <p className="font-body text-xs text-ultraviolet truncate">
                        {m.title}
                      </p>
                    </div>
                    {m._new && <span className="admin-chip admin-chip-add">new</span>}
                    {edited && <span className="admin-chip admin-chip-edit">edited</span>}
                  </div>

                  {memberCompanies(m).length > 0 && (
                    <div className="flex items-center gap-1.5">
                      {memberCompanies(m).map((c) => (
                        <img
                          key={c.id}
                          src={c._logoPreview ?? c.logo_url}
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

      <MemberModal
        open={editing !== null}
        initial={editing}
        companies={draftCompanies}
        trackUrl={trackUrl}
        onSubmit={upsertMember}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
