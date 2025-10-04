import { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from 'ioredis';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL!);

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { alias } = req.query;

  if (typeof alias !== 'string') {
    return res.status(400).json({ error: 'Invalid alias' });
  }

  try {
    // Check Redis cache
    const cachedUrl = await redis.get(alias);
    if (cachedUrl) {
      return res.json({ longUrl: cachedUrl, cached: true });
    }

    // Fallback to Supabase - try short_id first and increment clicks
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
        return res.status(404).json({ error: 'Not found' });
      }
      data = result.data;
      isCustomAlias = true;
    }

    // Log click
    const forwardedFor = req.headers['x-forwarded-for'] as string;
    const realIP = forwardedFor ? forwardedFor.split(',')[0].trim() : req.headers['x-real-ip'] || 'unknown';
    const ip = realIP; 
    const userAgent = req.headers['user-agent'];
    
    // Get geolocation
    let country = null, city = null;
    if (ip && ip !== 'unknown' && ip !== '127.0.0.1') {
      try {
        const geoResponse = await fetch(`https://ipinfo.io/${ip}/json`, {
          headers: {
            'Authorization': 'Bearer 29716b4fdee038'
          }
        });
        const geoData = await geoResponse.json();
        console.log('Geo lookup for IP:', ip, 'Result:', geoData);
        if (geoData.country) {
          country = geoData.country;
          city = geoData.city;
        }
      } catch (error) {
        console.error('Geolocation error:', error);
      }
    }
    
    console.log('Logging click:', { realIP, ip, country, city, userAgent });
    
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

    // Cache in Redis for 1 hour
    await redis.set(alias, data.long_url, 'EX', 3600);

    return res.json({ longUrl: data.long_url, cached: false });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
