-- HackKnight Admin — Supabase Schema

-- Schedule Events

CREATE TABLE schedule_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day TEXT NOT NULL CHECK (day IN ('fri', 'sat', 'sun')),
  start_hour NUMERIC NOT NULL,
  end_hour NUMERIC NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'violet',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE schedule_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read schedule_events" ON schedule_events FOR SELECT USING (true);
CREATE POLICY "Service role full access schedule_events" ON schedule_events FOR ALL USING (auth.role() = 'service_role');

-- Schedule Day Headers

CREATE TABLE schedule_days (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INT DEFAULT 0
);

ALTER TABLE schedule_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read schedule_days" ON schedule_days FOR SELECT USING (true);
CREATE POLICY "Service role full access schedule_days" ON schedule_days FOR ALL USING (auth.role() = 'service_role');

-- Seed day headers
INSERT INTO schedule_days (key, label, sort_order) VALUES
  ('fri', 'Fri Oct 9', 0),
  ('sat', 'Sat Oct 10', 1),
  ('sun', 'Sun Oct 11', 2);

-- Gallery Years

CREATE TABLE gallery_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year TEXT NOT NULL UNIQUE,
  sort_order INT DEFAULT 0
);

ALTER TABLE gallery_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read gallery_years" ON gallery_years FOR SELECT USING (true);
CREATE POLICY "Service role full access gallery_years" ON gallery_years FOR ALL USING (auth.role() = 'service_role');

-- Gallery Photos

CREATE TABLE gallery_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year_id UUID REFERENCES gallery_years(id) ON DELETE CASCADE,
  src TEXT NOT NULL,
  alt TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read gallery_photos" ON gallery_photos FOR SELECT USING (true);
CREATE POLICY "Service role full access gallery_photos" ON gallery_photos FOR ALL USING (auth.role() = 'service_role');

-- Team Members

CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  badge_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Migration (run against existing DB):
-- ALTER TABLE team_members ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
-- ALTER TABLE team_members ADD COLUMN IF NOT EXISTS github_url TEXT;

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read team_members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Service role full access team_members" ON team_members FOR ALL USING (auth.role() = 'service_role');

-- Seed Schedule Events

INSERT INTO schedule_events (day, start_hour, end_hour, label, color, sort_order) VALUES
  ('fri', 10, 11, 'Check-in begins', 'cyan', 0),
  ('fri', 11, 12, 'Opening Ceremony begins', 'violet', 1),
  ('fri', 12, 13, 'Hacking Begins', 'green', 2),
  ('fri', 13, 14, 'Lunch', 'orange', 3),
  ('fri', 19, 20, 'Dinner', 'orange', 4),
  ('fri', 23, 24, 'Midnight Ramen', 'orange', 5),
  ('sat', 9, 10, 'Breakfast', 'orange', 6),
  ('sat', 13, 14, 'Lunch', 'orange', 7),
  ('sat', 18, 19, 'Dinner', 'orange', 8),
  ('sat', 23, 24, 'Midnight Ramen', 'orange', 9),
  ('sun', 9, 10, 'Check-in starts', 'cyan', 10),
  ('sun', 12, 13, 'Submission Deadline', 'green', 11),
  ('sun', 12, 13, 'Lunch', 'orange', 12),
  ('sun', 12.5, 16.5, 'Judging', 'violet', 13),
  ('sun', 16, 17, 'Closing Ceremony', 'violet', 14);
