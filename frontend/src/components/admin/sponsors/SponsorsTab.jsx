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
} from "../../../lib/api";
import { SaveBar, DiffModal } from "../ui";
import { useObjectUrls } from "../useObjectUrls";
import {
  TIERS,
  EMPTY_SPONSOR,
  normalizeSponsor,
  sponsorFieldsEqual,
  tierLabel,
  tierMembers,
} from "./sponsorUtils";
import SponsorModal from "./SponsorModal";
import TierPanel from "./TierPanel";
import OtherCompaniesPanel from "./OtherCompaniesPanel";

export default function SponsorsTab({ onDirtyChange }) {
  const [serverCompanies, setServerCompanies] = useState([]);
  const [draftCompanies, setDraftCompanies] = useState([]);
  const [editing, setEditing] = useState(null); // seed for SponsorModal
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [error, setError] = useState(null);
  const tmpIdRef = useRef(0);
  const { trackUrl, revokeAll } = useObjectUrls();

  const load = useCallback(async () => {
    try {
      const companies = await apiGet("/companies");
      const normalized = companies.map(normalizeSponsor);
      setServerCompanies(normalized);
      setDraftCompanies(normalized.map((c) => ({ ...c })));
      revokeAll();
    } catch (err) {
      setError(err.message);
    }
  }, [revokeAll]);

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
    revokeAll();
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
