import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const Redis = require("ioredis");

const redis = new Redis(process.env.REDIS_URL!); 
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { alias } = req.query;

  if (typeof alias !== 'string') return res.status(400).json({ error: 'Invalid alias' });

  // Check Redis cache
  const cachedUrl = await redis.get(alias);
  if (cachedUrl) return res.json({ longUrl: cachedUrl, cached: true });

  // Fallback to Supabase
  const { data, error } = await supabase
    .from('urls')
    .select('long_url')
    .eq('custom_alias', alias)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Not found' });

  // Cache in Redis for 1 hour
  await redis.set(alias, data.long_url, 'EX', 3600);

  res.json({ longUrl: data.long_url, cached: false });
}
