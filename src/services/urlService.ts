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
    // Use current domain for redirects
    this.baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000';
  }

  async shortenUrl(longUrl: string, customAlias?: string): Promise<ShortenUrlResponse> {
    // Validate URL
    if (!this.isValidUrl(longUrl)) {
      throw new Error('Invalid URL provided');
    }

    // Always generate random short ID
    const shortId = nanoid(8);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // Save to database
    const { data, error } = await supabase
      .from('urls')
      .insert({
        long_url: longUrl,
        short_id: shortId,
        custom_alias: customAlias?.trim() || null,
        user_id: user?.id || null,
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
        return null;
      }
      data = result.data;
      isCustomAlias = true;
    }

    // Log click
    await supabase.from('click_logs').insert({
      url_id: data.id,
      alias,
      user_agent: navigator.userAgent
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

  async getUserUrls(): Promise<UrlRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('urls')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Failed to fetch user URLs:', error);
      return [];
    }
    
    return data || [];
  }

  async getAnalytics(alias: string) {
    const { data: url } = await supabase
      .from('urls')
      .select('id, clicks')
      .or(`short_id.eq.${alias},custom_alias.eq.${alias}`)
      .single();

    if (!url) return null;

    const { data: logs } = await supabase
      .from('click_logs')
      .select('created_at, country, city, user_agent')
      .eq('url_id', url.id)
      .order('created_at', { ascending: false });

    return {
      totalClicks: url.clicks || 0,
      clickLogs: logs || [],
      uniqueCountries: [...new Set(logs?.map(l => l.country).filter(Boolean))].length,
      topCountries: this.getTopItems(logs?.map(l => l.country).filter(Boolean) || []),
      topCities: this.getTopItems(logs?.map(l => l.city).filter(Boolean) || [])
    };
  }

  private getTopItems(items: string[]) {
    const counts = items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
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