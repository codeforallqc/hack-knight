// Fetches sponsors from the Express API (backed by the companies table —
// a company is a sponsor once it has a sponsor_tier).
// Falls back to the bundled static data if the API is unreachable.

import { useState, useEffect } from "react";
import { sponsors as staticSponsors } from "../data/sponsors";

const API_URL = import.meta.env.VITE_API_URL ?? "";

const TIER_RANK = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

function mapCompany(c) {
  return {
    id: c.id,
    name: c.name,
    logo: c.logo_url,
    tier: c.sponsor_tier,
    url: c.sponsor_url || "#",
    companyBlurb: c.sponsor_blurb || undefined,
  };
}

export function useSponsors() {
  const [sponsors, setSponsors] = useState(staticSponsors);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_URL}/companies`);
        if (!res.ok) throw new Error("Failed to fetch sponsors");
        const data = await res.json();
        if (cancelled) return;
        const mapped = (Array.isArray(data) ? data : [])
          .filter((c) => c.sponsor_tier)
          .map(mapCompany)
          .sort(
            (a, b) =>
              TIER_RANK[a.tier] - TIER_RANK[b.tier] ||
              a.name.localeCompare(b.name),
          );
        if (mapped.length > 0) setSponsors(mapped);
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

  return { sponsors, loading, error };
}
