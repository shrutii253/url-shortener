import { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from 'ioredis';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Helper functions
function parseUserAgent(userAgent: string) {
  const browser = userAgent.includes('Chrome') ? 'Chrome' :
                 userAgent.includes('Firefox') ? 'Firefox' :
                 userAgent.includes('Safari') ? 'Safari' :
                 userAgent.includes('Edge') ? 'Edge' : 'Other';
  
  const device = userAgent.includes('Mobile') ? 'Mobile' :
                userAgent.includes('Tablet') ? 'Tablet' : 'Desktop';
  
  return { browser, device };
}

async function getGeoData(ip: string) {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    return {
      country: data.country || null,
      city: data.city || null
    };
  } catch {
    return { country: null, city: null };
  }
}

function getClientIP(req: VercelRequest): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
         (req.headers['x-real-ip'] as string) || 
         req.connection?.remoteAddress || 
         '127.0.0.1';
}

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

    // Fallback to Supabase - try short_id first
    let { data, error } = await supabase
      .from('urls')
      .select('long_url')
      .eq('short_id', alias)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Get URL ID for analytics
    const { data: urlData } = await supabase
      .from('urls')
      .select('id')
      .eq('short_id', alias)
      .single();

    // Capture analytics data
    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    const { browser, device } = parseUserAgent(userAgent);
    const { country, city } = await getGeoData(ip);

    // Insert analytics record
    await supabase.from('url_analytics').insert({
      url_id: urlData?.id,
      ip_address: ip,
      user_agent: userAgent,
      country,
      city,
      browser,
      device
    });

    // Increment clicks
    await supabase.rpc('increment_clicks', { short_id_param: alias });

    // Cache in Redis for 1 hour
    await redis.set(alias, data.long_url, 'EX', 3600);

    return res.json({ longUrl: data.long_url, cached: false });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
