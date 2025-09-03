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

    // Use custom alias if provided, else generate unique short ID
    const shortId = customAlias && customAlias.trim() ? nanoid(8) : nanoid(8);
    const customAliasValue = customAlias && customAlias.trim() ? customAlias.trim() : null;

    // Save to database
    const { data, error } = await supabase
      .from('urls')
      .insert({
        long_url: longUrl,
        short_id: shortId,
        custom_alias: customAliasValue,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        throw new Error('Custom alias is already taken. Please choose another.');
      }
      console.error('Database error:', error);
      throw new Error('Failed to create short URL');
    }

    const shortUrl = customAliasValue
      ? `${this.baseUrl}/${customAliasValue}`
      : `${this.baseUrl}/${shortId}`;

    return {
      shortUrl,
      longUrl,
      shortId: customAliasValue || shortId,
    };
  }

  async getOriginalUrl(shortIdOrAlias: string): Promise<string | null> {
    // Try to find by short_id first
    let { data, error } = await supabase
      .from('urls')
      .select('long_url')
      .eq('short_id', shortIdOrAlias)
      .single();

    // If not found, try custom_alias
    if (!data) {
      const res = await supabase
        .from('urls')
        .select('long_url')
        .eq('custom_alias', shortIdOrAlias)
        .single();
      data = res.data;
      error = res.error;
    }

    if (error || !data) {
      return null;
    }

    // Increment click count
    await this.incrementClicks(shortIdOrAlias);

    return data.long_url;
  }

  async incrementClicks(shortId: string): Promise<void> {
    await supabase.rpc('increment_clicks', { short_id_param: shortId });
  }

  async logClick(shortId: string, userAgent: string, ipAddress?: string): Promise<void> {
    // Get url_id from short_id
    const { data: urlData } = await supabase
      .from('urls')
      .select('id')
      .eq('short_id', shortId)
      .single();
    if (!urlData) return;
    await supabase
      .from('url_clicks')
      .insert({
        url_id: urlData.id,
        short_id: shortId,
        user_agent: userAgent,
        ip_address: ipAddress || null,
      });
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

  async getAllUrlsWithClicks() {
    // Get all URLs and their clicks
    const { data: urls, error } = await supabase
      .from('urls')
      .select('id, long_url, short_id, custom_alias, clicks: url_clicks(id, clicked_at, user_agent, ip_address)')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to fetch URLs with clicks:', error);
      return { data: [] };
    }
    return { data: urls || [] };
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