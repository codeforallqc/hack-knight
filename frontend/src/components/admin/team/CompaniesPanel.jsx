// Collapsible Companies panel — reusable logo badges (max 2 per member)
// that render before the social icons on the public team section.
// All edits are staged; this panel only reports intents upward.

import { useRef, useState } from "react";
import { Panel, Field, EmptyState, CollapseTitle } from "../ui";
import { ReplaceIcon, XIcon } from "../icons";

export default function CompaniesPanel({
  companies,
  wearerCount,
  serverCompanies,
  trackUrl,
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
        <CollapseTitle open={open} onToggle={() => setOpen((o) => !o)}>
          Companies
        </CollapseTitle>
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
                      <ReplaceIcon />
                    </button>
                    <button
                      type="button"
                      className="admin-btn-icon admin-btn-icon-danger"
                      aria-label={`Delete ${company.name}`}
                      title="Delete company"
                      onClick={() => onRemove(company.id)}
                    >
                      <XIcon />
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
                setLogoPreview(trackUrl(file));
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
