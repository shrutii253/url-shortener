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

    // Cache in Redis immediately
    await redis.set(alias, data.long_url, 'EX', 3600);

    // Redirect IMMEDIATELY - don't wait for analytics
    res.redirect(302, data.long_url);

    // Run analytics asynchronously after redirect
    setImmediate(async () => {
      try {
        // Extract real IP address
        const forwardedFor = req.headers['x-forwarded-for'] as string;
        const realIP = req.headers['x-real-ip'] as string;
        const cfConnectingIP = req.headers['cf-connecting-ip'] as string;
        
        const ip = cfConnectingIP || 
                  (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || 
                  realIP || 
                  req.ip || 
                  'unknown';
        
        const userAgent = req.headers['user-agent'];
        console.log('IP extraction:', { forwardedFor, realIP, cfConnectingIP, finalIP: ip });
        
        // Get geolocation (async, doesn't block redirect)
        let country = null, city = null;
        if (ip && ip !== '127.0.0.1' && ip !== '::1' && !ip.startsWith('192.168.')) {
          try {
            // Try ipinfo.io first
            let geoResponse = await fetch(`https://ipinfo.io/${ip}/json`, {
              headers: process.env.IPINFO_TOKEN ? 
                { 'Authorization': `Bearer ${process.env.IPINFO_TOKEN}` } : {},
              signal: AbortSignal.timeout(3000)
            });
            
            if (!geoResponse.ok) {
              // Fallback to free service
              geoResponse = await fetch(`http://ip-api.com/json/${ip}`, {
                signal: AbortSignal.timeout(3000)
              });
              const geoData = await geoResponse.json();
              if (geoData.status === 'success') {
                country = geoData.countryCode;
                city = geoData.city;
              }
            } else {
              const geoData = await geoResponse.json();
              if (geoData.country) {
                country = geoData.country;
                city = geoData.city;
              }
            }
            
            console.log('Geo lookup for IP:', ip, 'Result:', { country, city });
          } catch (error) {
            console.error('Geolocation error:', error);
          }
        }
        
        // Log click and increment counter in parallel
        await Promise.all([
          supabase.from('click_logs').insert({
            url_id: data.id,
            alias,
            ip_address: ip,
            user_agent: userAgent,
            country,
            city
          }),
          
          // Increment clicks counter
          isCustomAlias
            ? supabase.from('urls').update({ clicks: (data.clicks || 0) + 1 }).eq('custom_alias', alias)
            : supabase.from('urls').update({ clicks: (data.clicks || 0) + 1 }).eq('short_id', alias)
        ]);
        
        console.log('Analytics completed asynchronously');
      } catch (analyticsError) {
        console.error('Analytics error (non-blocking):', analyticsError);
      }
    });
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