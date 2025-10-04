-- Create click_logs table for detailed analytics
CREATE TABLE IF NOT EXISTS click_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url_id uuid NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
  alias text,
  ip_address inet,
  user_agent text,
  country text,
  city text,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for fast queries
CREATE INDEX IF NOT EXISTS click_logs_url_id_idx ON click_logs(url_id);
CREATE INDEX IF NOT EXISTS click_logs_created_at_idx ON click_logs(created_at);
CREATE INDEX IF NOT EXISTS click_logs_ip_idx ON click_logs(ip_address);

-- Enable RLS
ALTER TABLE click_logs ENABLE ROW LEVEL SECURITY;

-- Allow public insert access for logging clicks
CREATE POLICY "Allow public insert for click logs" ON click_logs
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Allow public read access for analytics
CREATE POLICY "Allow public read for click logs" ON click_logs
  FOR SELECT 
  TO anon
  USING (true);