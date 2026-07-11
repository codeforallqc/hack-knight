// Fetches the site_settings key/value map from the Express API (Misc admin
// tab). Callers read individual keys and supply their own fallback defaults,
// so an unreachable API degrades to the bundled behavior.

import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "";

// Pass `enabled: false` to skip the fetch entirely (e.g. when a caller
// already has its own values, such as the admin live preview).
export function useSiteSettings({ enabled = true } = {}) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (!res.ok) throw new Error("Failed to fetch settings");
        const data = await res.json();
        if (cancelled) return;
        if (data && typeof data === "object") setSettings(data);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { settings, loading, error };
}
