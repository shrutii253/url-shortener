import { Redis } from 'ioredis';
import { createClient } from '@supabase/supabase-js';
import express from 'express';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';

dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

// Connect to Redis
const redis = new Redis(process.env.REDIS_URL);

// Connect to Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Redirect endpoint for short URLs
app.get('/:alias', async (req, res) => {
  const { alias } = req.params;
  console.log(`Looking for alias: ${alias}`);

  try {
    // 1. Try Redis cache first
    const cachedUrl = await redis.get(alias);
    if (cachedUrl) {
      console.log(`Found in cache: ${cachedUrl}`);
      return res.redirect(302, cachedUrl);
    }

    // 2. Fallback to Supabase - check both short_id and custom_alias
    let { data, error } = await supabase
      .from('urls')
      .select('id, long_url, clicks')
      .eq('short_id', alias)
      .single();

    console.log(`Short ID search result:`, { data, error });

    let isCustomAlias = false;
    if (error || !data) {
      // Try custom_alias
      const result = await supabase
        .from('urls')
        .select('id, long_url, clicks')
        .eq('custom_alias', alias)
        .single();
      
      console.log(`Custom alias search result:`, { data: result.data, error: result.error });
      
      if (result.error || !result.data) {
        console.log(`Alias '${alias}' not found in database`);
        return res.status(404).send(`Short URL '${alias}' not found`);
      }
      data = result.data;
      isCustomAlias = true;
    }

    // Log click
    const ip = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'];
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
    console.log(`Redirecting ${alias} to ${data.long_url}`);
    res.redirect(302, data.long_url);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});