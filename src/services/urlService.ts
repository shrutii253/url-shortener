import { supabase } from '../lib/supabase';
import { nanoid } from 'nanoid';
import type { UrlRecord } from '../lib/supabase';

export interface ShortenUrlRequest {
  longUrl: string;
}

export interface ShortenUrlResponse {
  shortUrl: string;
  longUrl: string;
  shortId: string;
}

class UrlService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = window.location.origin;
  }

  async shortenUrl(longUrl: string): Promise<ShortenUrlResponse> {
    // Validate URL
    if (!this.isValidUrl(longUrl)) {
      throw new Error('Invalid URL provided');
    }

    // Generate unique short ID
    const shortId = nanoid(8);

    // Save to database
    const { data, error } = await supabase
      .from('urls')
      .insert({
        long_url: longUrl,
        short_id: shortId,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to create short URL');
    }

    const shortUrl = `${this.baseUrl}/${shortId}`;

    return {
      shortUrl,
      longUrl,
      shortId,
    };
  }

  async getOriginalUrl(shortId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('urls')
      .select('long_url')
      .eq('short_id', shortId)
      .single();
    console.log('Supabase getOriginalUrl:', { shortId, data, error }); // Debug log
    if (error || !data) {
      return null;
    }

    // Increment click count
    await this.incrementClicks(shortId);

    return data.long_url;
  }

  async incrementClicks(shortId: string): Promise<void> {
    await supabase.rpc('increment_clicks', { short_id_param: shortId });
  }

  async getUrlStats(shortId: string): Promise<UrlRecord | null> {
    const { data, error } = await supabase
      .from('urls')
      .select('*')
      .eq('short_id', shortId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  private isValidUrl(string: string): boolean {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
}

export const urlService = new UrlService();