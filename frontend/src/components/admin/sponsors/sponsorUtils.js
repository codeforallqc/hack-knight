// Shared tier vocabulary + sponsor shapes/helpers for the sponsors tab.

export const TIERS = [
  { value: "platinum", label: "Platinum" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "bronze", label: "Bronze" },
];

export const EMPTY_SPONSOR = {
  name: "",
  sponsor_tier: "bronze",
  sponsor_url: "",
  sponsor_blurb: "",
  logo_url: null,
  _logoFile: null,
  _logoPreview: null,
};

export function normalizeSponsor(c) {
  return {
    ...c,
    sponsor_tier: c.sponsor_tier ?? "",
    sponsor_url: c.sponsor_url ?? "",
    sponsor_blurb: c.sponsor_blurb ?? "",
  };
}

export function sponsorFieldsEqual(a, b) {
  return (
    a.name === b.name &&
    a.sponsor_tier === b.sponsor_tier &&
    a.sponsor_url === b.sponsor_url &&
    a.sponsor_blurb === b.sponsor_blurb
  );
}

export function tierLabel(tier) {
  return TIERS.find((t) => t.value === tier)?.label ?? tier;
}

export function tierMembers(companies, tier) {
  return companies
    .filter((c) => c.sponsor_tier === tier)
    .slice()
    .sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name),
    );
}
