import { useState, useEffect } from 'react';
import { urlService } from '../services/urlService';
import type { UrlRecord } from '../lib/supabase';

export function useUrlStats(shortId: string | null) {
  const [stats, setStats] = useState<UrlRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!shortId) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await urlService.getUrlStats(shortId);
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [shortId]);

  return { stats, loading };
}