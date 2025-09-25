import Redis from 'ioredis';
import { createClient } from '@supabase/supabase-js';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { nanoid } from 'nanoid';

// get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// load .env explicitly from project root
dotenv.config({ path: resolve(__dirname, '../../.env') });


const app = express();
app.use(express.json());

const port = process.env.PORT || 4000;

// Connect to Redis
const redis = new (Redis as any)();// defaults to localhost:6379

// Connect to Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);


// Endpoint to get long URL from short alias
app.get('/api/url/:alias', async (req: Request, res: Response) => {
  const { alias } = req.params;

  // 1. Try Redis cache first
  const cachedUrl = await redis.get(alias);
  if (cachedUrl) {
    return res.json({ longUrl: cachedUrl, cached: true });
  }

  // 2. Fallback to Supabase
  const { data, error } = await supabase
    .from('urls')
    .select('long_url')
    .eq('custom_alias', alias)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Not found' });
  }

  // 3. Cache in Redis for next time
  await redis.set(alias, data.long_url, 'EX', 3600); // cache for 1 hour

  res.json({ longUrl: data.long_url, cached: false });
});

app.post('/api/url', async (req: Request, res: Response) => {
  const { longUrl, customAlias } = req.body;
  if (!longUrl || !customAlias) return res.status(400).json({ error: 'Missing fields' });

  const shortId = nanoid(8); 

  const { data, error } = await supabase.from('urls').insert({
    long_url: longUrl,
    custom_alias: customAlias,
    short_id: shortId
  });

  if (error) return res.status(500).json({ error: error.message });

  await redis.set(customAlias, longUrl, 'EX', 3600);
  res.json({ success: true, customAlias });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
