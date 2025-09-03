/*
  # Add increment clicks function

  1. Functions
    - `increment_clicks` function to safely increment click count for a URL
    
  2. Security
    - Function is accessible to public for click tracking
*/

CREATE OR REPLACE FUNCTION increment_clicks(short_id_param text)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE urls 
  SET clicks = clicks + 1 
  WHERE short_id = short_id_param;
$$;