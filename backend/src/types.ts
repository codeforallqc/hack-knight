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

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  photo_url: string;
  badge_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  sort_order: number;
  created_at?: string;
}

export interface CreateTeamMemberBody {
  name: string;
  title: string;
  linkedin_url?: string;
  github_url?: string;
  sort_order?: number;
}

export type UpdateTeamMemberBody = Partial<CreateTeamMemberBody>;
