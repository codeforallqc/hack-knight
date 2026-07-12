-- Companies — reusable logo badges wearable by team members.
-- Logos are uploaded once by an admin and assigned to members (max 2 each).

CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Service role full access companies" ON companies FOR ALL USING (auth.role() = 'service_role');

-- Team members wear up to two company badges, shown before social icons.
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS company1_id UUID REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS company2_id UUID REFERENCES companies(id) ON DELETE SET NULL;
