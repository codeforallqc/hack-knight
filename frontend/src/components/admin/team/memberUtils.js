// Shared member shapes/helpers for the team tab.

export const EMPTY_MEMBER = {
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

export function normalizeMember(m) {
  return {
    ...m,
    linkedin_url: m.linkedin_url ?? "",
    github_url: m.github_url ?? "",
    company1_id: m.company1_id ?? "",
    company2_id: m.company2_id ?? "",
  };
}

export function memberFieldsEqual(a, b) {
  return (
    a.name === b.name &&
    a.title === b.title &&
    a.linkedin_url === b.linkedin_url &&
    a.github_url === b.github_url &&
    a.company1_id === b.company1_id &&
    a.company2_id === b.company2_id
  );
}
