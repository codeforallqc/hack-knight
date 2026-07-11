// Team admin tab — drag card order = display priority, staged until save.
// Owns the draft state for members + companies and the save orchestration;
// the Companies panel and member modal live in their own modules.

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
} from "../ui";
import { PencilIcon, XIcon } from "../icons";
import { useObjectUrls } from "../useObjectUrls";
import { EMPTY_MEMBER, normalizeMember, memberFieldsEqual } from "./memberUtils";
import MemberModal from "./MemberModal";
import CompaniesPanel from "./CompaniesPanel";

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
  const { trackUrl, revokeAll } = useObjectUrls();

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
      revokeAll();
    } catch (err) {
      setError(err.message);
    }
  }, [revokeAll]);

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
    revokeAll();
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
        trackUrl={trackUrl}
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

                    <CardOverlay>
                      <button
                        type="button"
                        className="admin-btn-icon"
                        aria-label={`Edit ${m.name}`}
                        title="Edit member"
                        onClick={() => setEditing({ ...m })}
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        className="admin-btn-icon admin-btn-icon-danger"
                        aria-label={`Delete ${m.name}`}
                        title="Delete member"
                        onClick={() => removeMember(m.id)}
                      >
                        <XIcon />
                      </button>
                    </CardOverlay>

                    <CardMoveButtons
                      label={m.name}
                      index={idx}
                      total={draftMembers.length}
                      move={move}
                    />
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
