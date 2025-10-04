import { supabase } from '../lib/supabase';
import { nanoid } from 'nanoid';
import type { UrlRecord } from '../lib/supabase';

export interface ShortenUrlRequest {
  longUrl: string;
  customAlias?: string;
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

  async shortenUrl(longUrl: string, customAlias?: string): Promise<ShortenUrlResponse> {
    // Validate URL
    if (!this.isValidUrl(longUrl)) {
      throw new Error('Invalid URL provided');
    }

    // Always generate random short ID
    const shortId = nanoid(8);

    // Save to database
    const { data, error } = await supabase
      .from('urls')
      .insert({
        long_url: longUrl,
        short_id: shortId,
        custom_alias: customAlias?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        throw new Error('Custom alias is already taken. Please try another.');
      }
      console.error('Database error:', error);
      throw new Error('Failed to create short URL');
    }

    const alias = customAlias?.trim() || shortId;
    const shortUrl = `${this.baseUrl}/${alias}`;

    return {
      shortUrl,
      longUrl,
      shortId: alias,
    };
  }

  async getOriginalUrl(alias: string): Promise<string | null> {
    // Try short_id first
    let { data, error } = await supabase
      .from('urls')
      .select('long_url')
      .eq('short_id', alias)
      .single();

    // If not found, try custom_alias
    if (error || !data) {
      const result = await supabase
        .from('urls')
        .select('long_url')
        .eq('custom_alias', alias)
        .single();
      
      if (result.error || !result.data) {
        return null;
      }
      data = result.data;
    }

    return data.long_url;
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

  async getAllUrls(): Promise<UrlRecord[]> {
    const { data, error } = await supabase
      .from('urls')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Failed to fetch URLs:', error);
      return [];
    }
    
    return data || [];
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