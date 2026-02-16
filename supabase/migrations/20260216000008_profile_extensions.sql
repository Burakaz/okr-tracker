-- Profile extensions: position, craft_focus
-- These fields allow users to set their job title and focus area

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS craft_focus TEXT;

-- Add domain field to organizations if not exists
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS domain TEXT;

COMMENT ON COLUMN profiles.position IS 'Job title, e.g. "Performance Marketing Manager"';
COMMENT ON COLUMN profiles.craft_focus IS 'Focus area: design, development, marketing, sales, operations, hr, finance, other';
COMMENT ON COLUMN organizations.domain IS 'Company domain, e.g. "admkrs.com"';
