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
