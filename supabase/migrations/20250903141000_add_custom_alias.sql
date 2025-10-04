-- Add custom_alias column to urls table
ALTER TABLE urls ADD COLUMN custom_alias text UNIQUE;

-- Add index for custom_alias lookups
CREATE INDEX IF NOT EXISTS urls_custom_alias_idx ON urls(custom_alias);