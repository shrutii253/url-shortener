/*
  # Create URLs table for URL shortener

  1. New Tables
    - `urls`
      - `id` (uuid, primary key) 
      - `long_url` (text, the original URL to shorten)
      - `short_id` (text, unique identifier for the short URL)
      - `clicks` (integer, number of times the short URL was accessed)
      - `created_at` (timestamp, when the URL was created)
      - `expires_at` (timestamp, optional expiration date)

  2. Security
    - Enable RLS on `urls` table
    - Add policy for public read access (needed for redirects)
    - Add policy for public insert access (needed for URL creation)

  3. Indexes
    - Add unique index on `short_id` for fast lookups
    - Add index on `created_at` for analytics queries
*/

CREATE TABLE IF NOT EXISTS urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  long_url text NOT NULL,
  short_id text UNIQUE NOT NULL,
  clicks integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT NULL
);

-- Add unique index on short_id for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS urls_short_id_idx ON urls(short_id);

-- Add index for analytics and cleanup queries
CREATE INDEX IF NOT EXISTS urls_created_at_idx ON urls(created_at);

-- Enable Row Level Security
ALTER TABLE urls ENABLE ROW LEVEL SECURITY;

-- Allow public read access (needed for redirects)
CREATE POLICY "Allow public read access" ON urls
  FOR SELECT 
  TO anon
  USING (true);

-- Allow public insert access (needed for URL creation)
CREATE POLICY "Allow public insert access" ON urls
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Allow public update access for click counting
CREATE POLICY "Allow public update for clicks" ON urls
  FOR UPDATE 
  TO anon
  USING (true);