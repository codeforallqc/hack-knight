-- Sponsors — reuse the companies table (same logos already power team
-- badges). A company becomes a public sponsor once it has a sponsor_tier;
-- badge-only companies keep sponsor_tier NULL.
ALTER TABLE companies ADD COLUMN IF NOT EXISTS sponsor_tier TEXT
  CHECK (sponsor_tier IN ('platinum', 'gold', 'silver', 'bronze'));
ALTER TABLE companies ADD COLUMN IF NOT EXISTS sponsor_url TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS sponsor_blurb TEXT;

-- Site settings — singleton key/value store for the Misc admin tab
-- (countdown target date today, room for future one-off settings).
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Service role full access site_settings" ON site_settings FOR ALL USING (auth.role() = 'service_role');

INSERT INTO site_settings (key, value) VALUES
  ('countdown_target', '2026-10-09T00:00:00'),
  ('mlh_badge_enabled', 'false')
ON CONFLICT (key) DO NOTHING;
