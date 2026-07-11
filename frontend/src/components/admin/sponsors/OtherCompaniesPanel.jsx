// Collapsible list of badge-only companies (from the Team tab) that aren't
// public sponsors yet — editing one can assign it a tier.

import { useState } from "react";
import { Panel, EmptyState, CollapseTitle } from "../ui";
import { PencilIcon } from "../icons";

export default function OtherCompaniesPanel({ companies, onEdit }) {
  const [open, setOpen] = useState(false);
  const items = companies
    .filter((c) => !c.sponsor_tier)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Panel
      title={
        <CollapseTitle open={open} onToggle={() => setOpen((o) => !o)}>
          Other Companies
        </CollapseTitle>
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
                  <PencilIcon />
                </button>
              </li>
            ))}
          </ul>
        ))}
    </Panel>
  );
}
