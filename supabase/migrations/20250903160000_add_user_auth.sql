-- Enable Row Level Security
ALTER TABLE urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_logs ENABLE ROW LEVEL SECURITY;

-- Add user_id column to urls table
ALTER TABLE urls ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Create index for better performance
CREATE INDEX idx_urls_user_id ON urls(user_id);

-- RLS Policies for urls table
CREATE POLICY "Users can view their own URLs" ON urls
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own URLs" ON urls
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own URLs" ON urls
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for click_logs table
CREATE POLICY "Users can view clicks for their URLs" ON click_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM urls 
      WHERE urls.id = click_logs.url_id 
      AND (urls.user_id = auth.uid() OR urls.user_id IS NULL)
    )
  );

CREATE POLICY "Anyone can insert click logs" ON click_logs
  FOR INSERT WITH CHECK (true);