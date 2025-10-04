import { useUrlStats } from '../hooks/useUrlStats';

interface UrlStatsDashboardProps {
  shortId: string;
}

export function UrlStatsDashboard({ shortId }: UrlStatsDashboardProps) {
  const { stats, loading } = useUrlStats(shortId);

  if (loading) {
    return <div className="text-center">Loading stats...</div>;
  }

  if (!stats) {
    return <div className="text-center text-red-500">No stats found</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">URL Statistics</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Short URL:</span>
          <span className="font-mono">{stats.short_id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Original URL:</span>
          <span className="truncate max-w-xs">{stats.long_url}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Clicks:</span>
          <span className="font-bold text-blue-600">{stats.clicks}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Created:</span>
          <span>{new Date(stats.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}