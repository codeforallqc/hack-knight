// Reads the countdown target date from the site settings (Misc admin tab).
// Falls back to the bundled default if the API is unreachable.

import { useSiteSettings } from "./useSiteSettings";

export const DEFAULT_COUNTDOWN_TARGET = "2026-10-09T00:00:00";

// Pass `enabled: false` to skip the fetch entirely (e.g. when a caller
// already has its own target date, such as the admin live preview).
export function useCountdown({ enabled = true } = {}) {
  const { settings, loading, error } = useSiteSettings({ enabled });
  return {
    targetDate: settings.countdown_target ?? DEFAULT_COUNTDOWN_TARGET,
    loading,
    error,
  };
}
