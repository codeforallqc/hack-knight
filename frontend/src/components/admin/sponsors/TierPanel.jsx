// One sponsor tier — drag-to-sort logo cards with edit/delete overlays.

import {
  Panel,
  EmptyState,
  DragGrid,
  CardOverlay,
  CardMoveButtons,
} from "../ui";
import { PencilIcon, XIcon } from "../icons";
import { tierLabel, tierMembers } from "./sponsorUtils";

export default function TierPanel({ tier, companies, onAdd, onEdit, onRemove, onReorder }) {
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

              <CardOverlay>
                <button
                  type="button"
                  className="admin-btn-icon"
                  aria-label={`Edit ${c.name}`}
                  title="Edit sponsor"
                  onClick={() => onEdit(c)}
                >
                  <PencilIcon />
                </button>
                <button
                  type="button"
                  className="admin-btn-icon admin-btn-icon-danger"
                  aria-label={`Delete ${c.name}`}
                  title="Delete sponsor"
                  onClick={() => onRemove(c.id)}
                >
                  <XIcon />
                </button>
              </CardOverlay>

              <CardMoveButtons
                label={c.name}
                index={idx}
                total={items.length}
                move={move}
              />
            </div>
          )}
        />
      )}
    </Panel>
  );
}
