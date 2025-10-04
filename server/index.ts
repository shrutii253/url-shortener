import { Redis } from 'ioredis';
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
dotenv.config({ path: resolve(__dirname, '../.env') });


const app = express();
app.use(express.json());

const port = process.env.PORT || 4000;

// Connect to Redis
const redis = new Redis(process.env.REDIS_URL!);


// Connect to Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);


// Redirect endpoint for short URLs
app.get('/:alias', async (req: Request, res: Response) => {
  const { alias } = req.params;

  try {
    // 1. Try Redis cache first
    const cachedUrl = await redis.get(alias);
    if (cachedUrl) {
      return res.redirect(302, cachedUrl);
    }

    // 2. Fallback to Supabase - check both short_id and custom_alias
    let { data, error } = await supabase
      .from('urls')
      .select('id, long_url, clicks')
      .eq('short_id', alias)
      .single();

    let isCustomAlias = false;
    if (error || !data) {
      // Try custom_alias
      const result = await supabase
        .from('urls')
        .select('id, long_url, clicks')
        .eq('custom_alias', alias)
        .single();
      
      if (result.error || !result.data) {
        return res.status(404).send('Short URL not found');
      }
      data = result.data;
      isCustomAlias = true;
    }

    // Log click
    const ip = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
    const userAgent = req.headers['user-agent'];
    
    // Get geolocation
    let country = null, city = null;
    if (ip && ip !== '127.0.0.1' && ip !== '::1') {
      try {
        const geoResponse = await fetch(`https://ipinfo.io/${ip}/json`, {
          headers: {
            'Authorization': 'Bearer 29716b4fdee038'
          }
        });
        const geoData = await geoResponse.json();
        if (geoData.country) {
          country = geoData.country;
          city = geoData.city;
        }
      } catch (error) {
        console.error('Geolocation error:', error);
      }
    }
    
    await supabase.from('click_logs').insert({
      url_id: data.id,
      alias,
      ip_address: ip,
      user_agent: userAgent,
      country,
      city
    });

    // Increment clicks counter
    if (isCustomAlias) {
      await supabase
        .from('urls')
        .update({ clicks: (data.clicks || 0) + 1 })
        .eq('custom_alias', alias);
    } else {
      await supabase
        .from('urls')
        .update({ clicks: (data.clicks || 0) + 1 })
        .eq('short_id', alias);
    }

    // 3. Cache in Redis for next time
    await redis.set(alias, data.long_url, 'EX', 3600);

    // Redirect to the original URL
    res.redirect(302, data.long_url);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});

// API endpoint to get URL data (for analytics)
app.get('/api/url/:alias', async (req: Request, res: Response) => {
  const { alias } = req.params;

  try {
    let { data, error } = await supabase
      .from('urls')
      .select('id, long_url, clicks')
      .eq('short_id', alias)
      .single();

    if (error || !data) {
      const result = await supabase
        .from('urls')
        .select('id, long_url, clicks')
        .eq('custom_alias', alias)
        .single();
      
      if (result.error || !result.data) {
        return res.status(404).json({ error: 'Not found' });
      }
      data = result.data;
    }

    res.json({ longUrl: data.long_url, clicks: data.clicks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
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