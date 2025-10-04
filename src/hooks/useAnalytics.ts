import { useState, useEffect } from 'react';
import { analyticsService, type AnalyticsData } from '../services/analyticsService';

export function useAnalytics(shortId: string) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!shortId) return;
      
      setLoading(true);
      const data = await analyticsService.getUrlAnalytics(shortId);
      setAnalytics(data);
      setLoading(false);
    }

    fetchAnalytics();
  }, [shortId]);

  return { analytics, loading };
}