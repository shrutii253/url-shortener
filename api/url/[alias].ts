import { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from 'ioredis';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Redis client with error handling
let redis: Redis | null = null;
try {
  redis = new Redis(process.env.REDIS_URL!);
} catch (error) {
  console.error('Redis connection failed:', error);
}

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
    // Check Redis cache with error handling
    let cachedUrl = null;
    if (redis) {
      try {
        cachedUrl = await redis.get(alias);
        console.log('Redis GET:', alias, '->', cachedUrl);
      } catch (redisError) {
        console.error('Redis GET error:', redisError);
      }
    }
    
    if (cachedUrl) {
      console.log('Redis HIT - redirecting');
      return res.redirect(302, cachedUrl);
    }
    console.log('Redis MISS - checking database');

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

    // Cache in Redis immediately for next request
    if (redis) {
      try {
        await redis.set(alias, data.long_url, 'EX', 3600);
        console.log('Redis SET success:', alias);
      } catch (redisSetError) {
        console.error('Redis SET error:', redisSetError);
      }
    }

    // Redirect IMMEDIATELY - don't wait for analytics
    res.redirect(302, data.long_url);

    // Run analytics asynchronously after redirect
    setImmediate(async () => {
      try {
        // Extract real IP address with better debugging
        const forwardedFor = req.headers['x-forwarded-for'] as string;
        const realIP = req.headers['x-real-ip'] as string;
        const cfConnectingIP = req.headers['cf-connecting-ip'] as string;
        const vercelForwardedFor = req.headers['x-vercel-forwarded-for'] as string;
        
        // Log all available headers for debugging
        console.log('All IP headers:', {
          'x-forwarded-for': forwardedFor,
          'x-real-ip': realIP,
          'cf-connecting-ip': cfConnectingIP,
          'x-vercel-forwarded-for': vercelForwardedFor
        });
        
        const ip = cfConnectingIP || 
                  vercelForwardedFor ||
                  (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || 
                  realIP || 
                  'unknown';
        
        const userAgent = req.headers['user-agent'];
        console.log('IP extraction:', { forwardedFor, realIP, cfConnectingIP, finalIP: ip });
        
        // Get geolocation (async, doesn't block redirect)
        let country = null, city = null;
        
        // Debug: Check if IP passes filtering
        const ipPassesFilter = ip && 
                              ip !== 'unknown' && 
                              ip !== '127.0.0.1' && 
                              ip !== '::1' &&
                              !ip.startsWith('192.168.') && 
                              !ip.startsWith('10.') && 
                              !ip.startsWith('172.16.') &&
                              !ip.startsWith('::ffff:127.') &&
                              !ip.includes('localhost');
        
        console.log('IP filter check:', { ip, passesFilter: ipPassesFilter });
        
        if (ipPassesFilter) {
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
        } else {
          console.log('IP filtered out or invalid:', { ip, reason: 'Local/private IP detected' });
          
          // In development, you can uncomment this to test with a real IP:
          // if (process.env.NODE_ENV === 'development') {
          //   console.log('Development mode - testing with 8.8.8.8');
          //   const testIP = '8.8.8.8';
          //   // ... use testIP for geolocation
          // }
        }
        
        console.log('Logging click:', { ip, country, city, userAgent });
        
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

    return; // Request already completed with redirect
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
