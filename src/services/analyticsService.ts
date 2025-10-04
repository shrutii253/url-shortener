import { supabase } from '../lib/supabase';

export interface AnalyticsData {
  total_clicks: number;
  unique_visitors: number;
  top_countries: Array<{ country: string; count: number }>;
  top_browsers: Array<{ browser: string; count: number }>;
  daily_clicks: Array<{ date: string; clicks: number }>;
}

class AnalyticsService {
  async getUrlAnalytics(shortId: string): Promise<AnalyticsData | null> {
    const { data, error } = await supabase
      .rpc('get_url_analytics', { url_short_id: shortId })
      .single();

    if (error || !data) {
      console.error('Failed to fetch analytics:', error);
      return null;
    }

    return {
      total_clicks: data.total_clicks || 0,
      unique_visitors: data.unique_visitors || 0,
      top_countries: data.top_countries || [],
      top_browsers: data.top_browsers || [],
      daily_clicks: data.daily_clicks || []
    };
  }
}

export const analyticsService = new AnalyticsService();