export interface ScheduleEvent {
  id: string;
  day: "fri" | "sat" | "sun";
  start_hour: number;
  end_hour: number;
  label: string;
  color: string;
  sort_order: number;
  created_at?: string;
}

export interface CreateScheduleEventBody {
  day: "fri" | "sat" | "sun";
  start_hour: number;
  end_hour: number;
  label: string;
  color?: string;
  sort_order?: number;
}

export type UpdateScheduleEventBody = Partial<CreateScheduleEventBody>;

export interface ScheduleDay {
  key: string;
  label: string;
  sort_order: number;
}

export interface UpdateScheduleDayBody {
  label: string;
}

export interface GalleryYear {
  id: string;
  year: string;
  sort_order: number;
  created_at?: string;
}

export interface GalleryPhoto {
  id: string;
  year_id: string;
  src: string;
  alt: string;
  sort_order: number;
  created_at?: string;
}

export interface GalleryYearWithPhotos extends GalleryYear {
  photos: GalleryPhoto[];
}

export type SponsorTier = "platinum" | "gold" | "silver" | "bronze";

export interface Company {
  id: string;
  name: string;
  logo_url: string;
  sort_order: number;
  created_at?: string;
  sponsor_tier: SponsorTier | null;
  sponsor_url: string | null;
  sponsor_blurb: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  photo_url: string;
  badge_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  company1_id: string | null;
  company2_id: string | null;
  sort_order: number;
  created_at?: string;
}

// GET /api/team embeds the resolved company rows (order: company1, company2).
export interface TeamMemberWithCompanies extends TeamMember {
  companies: Company[];
}

export interface CreateTeamMemberBody {
  name: string;
  title: string;
  linkedin_url?: string;
  github_url?: string;
  company1_id?: string;
  company2_id?: string;
  sort_order?: number;
}

export type UpdateTeamMemberBody = Partial<CreateTeamMemberBody>;

// PUT /api/team/reorder, PUT /api/gallery/photos/reorder, PUT /api/companies/reorder
export interface ReorderBody {
  order: { id: string; sort_order: number }[];
}

export interface SiteSetting {
  key: string;
  value: string;
  updated_at?: string;
}

export interface UpdateSiteSettingBody {
  value: string;
}
