/*
  # Add analytics tracking for URL clicks

  1. New Tables
    - `url_analytics` - detailed click tracking
      - `id` (uuid, primary key)
      - `url_id` (uuid, foreign key to urls table)
      - `ip_address` (text, visitor IP for geo lookup)
      - `user_agent` (text, browser/device info)
      - `country` (text, resolved from IP)
      - `city` (text, resolved from IP)
      - `browser` (text, parsed from user agent)
      - `device` (text, parsed from user agent)
      - `clicked_at` (timestamp)

  2. Security
    - Enable RLS on analytics table
    - Add policies for public insert (click tracking)
    - Add policies for public read (analytics dashboard)

  3. Indexes
    - Add indexes for efficient analytics queries
*/

CREATE TABLE IF NOT EXISTS url_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url_id uuid REFERENCES urls(id) ON DELETE CASCADE,
  ip_address text,
  user_agent text,
  country text,
  city text,
  browser text,
  device text,
  clicked_at timestamptz DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS url_analytics_url_id_idx ON url_analytics(url_id);
CREATE INDEX IF NOT EXISTS url_analytics_clicked_at_idx ON url_analytics(clicked_at);
CREATE INDEX IF NOT EXISTS url_analytics_country_idx ON url_analytics(country);
CREATE INDEX IF NOT EXISTS url_analytics_browser_idx ON url_analytics(browser);

-- Enable RLS
ALTER TABLE url_analytics ENABLE ROW LEVEL SECURITY;

-- Allow public insert for click tracking
CREATE POLICY "Allow public insert for analytics" ON url_analytics
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Allow public read for analytics dashboard
CREATE POLICY "Allow public read for analytics" ON url_analytics
  FOR SELECT 
  TO anon
  USING (true);

-- Function to get analytics summary
CREATE OR REPLACE FUNCTION get_url_analytics(url_short_id text)
RETURNS TABLE (
  total_clicks bigint,
  unique_visitors bigint,
  top_countries json,
  top_browsers json,
  daily_clicks json
)
LANGUAGE sql
AS $$
  WITH url_data AS (
    SELECT id FROM urls WHERE short_id = url_short_id
  ),
  analytics_data AS (
    SELECT * FROM url_analytics 
    WHERE url_id = (SELECT id FROM url_data)
  )
  SELECT 
    COUNT(*)::bigint as total_clicks,
    COUNT(DISTINCT ip_address)::bigint as unique_visitors,
    (
      SELECT json_agg(json_build_object('country', country, 'count', count))
      FROM (
        SELECT country, COUNT(*) as count
        FROM analytics_data 
        WHERE country IS NOT NULL
        GROUP BY country 
        ORDER BY count DESC 
        LIMIT 5
      ) countries
    ) as top_countries,
    (
      SELECT json_agg(json_build_object('browser', browser, 'count', count))
      FROM (
        SELECT browser, COUNT(*) as count
        FROM analytics_data 
        WHERE browser IS NOT NULL
        GROUP BY browser 
        ORDER BY count DESC 
        LIMIT 5
      ) browsers
    ) as top_browsers,
    (
      SELECT json_agg(json_build_object('date', date, 'clicks', clicks))
      FROM (
        SELECT 
          DATE(clicked_at) as date,
          COUNT(*) as clicks
        FROM analytics_data 
        WHERE clicked_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(clicked_at)
        ORDER BY date DESC
      ) daily
    ) as daily_clicks
  FROM analytics_data;
$$;