// Sponsors admin tab — manages the sponsors table (separate from the badge
// companies on the Team tab). Every sponsor has a tier; tiers are shown as
// separate drag-to-sort panels.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  apiGet,
  apiPut,
  apiDelete,
  apiUpload,
  compressImage,
} from "../../../lib/api";
import { SaveBar, DiffModal, type Change } from "../ui";
import { useObjectUrls } from "../useObjectUrls";
import type { SponsorTier } from "../../../types";
import type { AdminSponsor, SponsorForm, SponsorRow } from "../adminTypes";
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

export default function SponsorsTab({ onDirtyChange }: { onDirtyChange?: (count: number) => void }) {
  const [serverSponsors, setServerSponsors] = useState<AdminSponsor[]>([]);
  const [draftSponsors, setDraftSponsors] = useState<AdminSponsor[]>([]);
  const [editing, setEditing] = useState<SponsorForm | null>(null); // seed for SponsorModal
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tmpIdRef = useRef(0);
  const { trackUrl, revokeAll } = useObjectUrls();

  const load = useCallback(async () => {
    try {
      const sponsors = await apiGet<SponsorRow[]>("/sponsors");
      const normalized = sponsors.map(normalizeSponsor);
      setServerSponsors(normalized);
      setDraftSponsors(normalized.map((s) => ({ ...s })));
      revokeAll();
    } catch (err) {
      setError((err as Error).message);
    }
  }, [revokeAll]);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Staged diff ── */

  function tierReorderChanged(tier: SponsorTier) {
    const draftIds = tierMembers(draftSponsors, tier)
      .filter((s) => !s._new)
      .map((s) => s.id);
    const serverIds = tierMembers(serverSponsors, tier)
      .map((s) => s.id)
      .filter((id) => draftIds.includes(id));
    return draftIds.join(",") !== serverIds.join(",");
  }

  const changes = useMemo(() => {
    const list: Change[] = [];

    for (const s of draftSponsors) {
      if (s._new) {
        list.push({
          kind: "add",
          summary: `Sponsor "${s.name}"`,
          detail: tierLabel(s.tier),
        });
        continue;
      }
      const orig = serverSponsors.find((o) => o.id === s.id);
      if (!orig) continue;
      const parts: string[] = [];
      if (orig.name !== s.name) parts.push(`name "${orig.name}" → "${s.name}"`);
      if (orig.tier !== s.tier)
        parts.push(`tier ${tierLabel(orig.tier)} → ${tierLabel(s.tier)}`);
      if (orig.url !== s.url) parts.push("website URL");
      if (orig.blurb !== s.blurb) parts.push("blurb");
      if (s._logoFile) parts.push("new logo");
      if (parts.length) {
        list.push({ kind: "edit", summary: `"${orig.name}"`, detail: parts.join(" · ") });
      }
    }

    for (const orig of serverSponsors) {
      if (!draftSponsors.some((s) => s.id === orig.id)) {
        list.push({
          kind: "delete",
          summary: `"${orig.name}"`,
          detail: "Removed from the public sponsors page",
        });
      }
    }

    for (const t of TIERS) {
      if (tierReorderChanged(t.value)) {
        list.push({ kind: "reorder", summary: `${t.label} sponsor order` });
      }
    }

    return list;
    // tierReorderChanged closes over draftSponsors/serverSponsors directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftSponsors, serverSponsors]);

  useEffect(() => {
    onDirtyChange?.(changes.length);
  }, [changes.length, onDirtyChange]);

  /* ── Draft mutations ── */

  function openAdd(tier: SponsorTier) {
    setEditing({ ...EMPTY_SPONSOR, tier });
  }

  function upsertSponsor(form: SponsorForm) {
    if (form.id) {
      setDraftSponsors((sponsors) =>
        sponsors.map((s) => (s.id === form.id ? { ...s, ...form, id: s.id } : s)),
      );
    } else {
      const sortOrder = tierMembers(draftSponsors, form.tier).length;
      setDraftSponsors((sponsors) => [
        ...sponsors,
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

  function removeSponsor(id: string) {
    setDraftSponsors((sponsors) => sponsors.filter((s) => s.id !== id));
  }

  function reorderTier(_tier: SponsorTier, nextItems: AdminSponsor[]) {
    setDraftSponsors((sponsors) =>
      sponsors.map((s) => {
        const idx = nextItems.findIndex((n) => n.id === s.id);
        return idx === -1 ? s : { ...s, sort_order: idx };
      }),
    );
  }

  function discard() {
    setDraftSponsors(serverSponsors.map((s) => ({ ...s })));
    setError(null);
    revokeAll();
  }

  /* ── Apply ── */

  async function applySave() {
    setSaving(true);
    setSaveError(null);
    try {
      // 1. Create new sponsors (tmp id → real id).
      const idMap = new Map<string, string>();
      for (const s of draftSponsors) {
        if (!s._new) continue;
        const formData = new FormData();
        formData.append("name", s.name);
        formData.append("tier", s.tier);
        formData.append("url", s.url || "");
        formData.append("blurb", s.blurb || "");
        const compressed = await compressImage(s._logoFile!);
        formData.append("logo", compressed);
        const created = await apiUpload<{ id: string }>("/sponsors", formData);
        idMap.set(s.id, created.id);
      }

      // 2. Update edited sponsors.
      for (const s of draftSponsors) {
        if (s._new) continue;
        const orig = serverSponsors.find((o) => o.id === s.id);
        if (!orig) continue;
        if (sponsorFieldsEqual(orig, s) && !s._logoFile) continue;
        const formData = new FormData();
        if (orig.name !== s.name) formData.append("name", s.name);
        if (orig.tier !== s.tier) formData.append("tier", s.tier);
        if (orig.url !== s.url) formData.append("url", s.url || "");
        if (orig.blurb !== s.blurb) formData.append("blurb", s.blurb || "");
        if (s._logoFile) {
          const compressed = await compressImage(s._logoFile);
          formData.append("logo", compressed);
        }
        await apiUpload(`/sponsors/${s.id}`, formData, "PUT");
      }

      // 3. Delete removed sponsors.
      for (const orig of serverSponsors) {
        if (!draftSponsors.some((s) => s.id === orig.id)) {
          await apiDelete(`/sponsors/${orig.id}`);
        }
      }

      // 4. Persist tier display order for every sponsor (new + existing).
      const order = TIERS.flatMap((t) =>
        tierMembers(draftSponsors, t.value).map((s, idx) => ({
          id: idMap.get(s.id) ?? s.id,
          sort_order: idx,
        })),
      );
      if (order.length > 0) {
        await apiPut("/sponsors/reorder", { order });
      }

      setReviewOpen(false);
      await load();
    } catch (err) {
      setSaveError(
        `Save failed partway: ${(err as Error).message}. Sponsors were reloaded — review what applied and re-stage the rest.`,
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
          sponsors={draftSponsors}
          onAdd={openAdd}
          onEdit={setEditing}
          onRemove={removeSponsor}
          onReorder={(next) => reorderTier(t.value, next)}
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
