// Fetches team members from the Express API.
// Falls back to the bundled static data if the API is unreachable.

import { useState, useEffect } from "react";
import { teamMembers as staticTeam } from "../data/team";

const API_URL = import.meta.env.VITE_API_URL ?? "";

// Backend rows are snake_case; the components expect photo / badge.
function mapMember(m) {
  return {
    id: m.id,
    name: m.name,
    title: m.title,
    photo: m.photo_url,
    badge: m.badge_url,
    linkedin: m.linkedin_url || null,
    github: m.github_url || null,
    sortOrder: m.sort_order,
  };
}

export function useTeam() {
  const [teamMembers, setTeamMembers] = useState(staticTeam);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_URL}/team`);
        if (!res.ok) throw new Error("Failed to fetch team");
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) {
          setTeamMembers(data.map(mapMember));
        }
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
  }, []);

  return { teamMembers, loading, error };
}
