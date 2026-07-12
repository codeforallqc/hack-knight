// Add / edit member modal for the team tab.

import { useRef, useState } from "react";
import { Field, Modal } from "../ui";

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

/* ── Modal ── */

export default function MemberModal({ open, initial, companies, trackUrl, onSubmit, onClose }) {
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
