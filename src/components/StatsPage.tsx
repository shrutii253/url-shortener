import { useParams } from 'react-router-dom';
import { UrlStatsDashboard } from './UrlStatsDashboard';

export function StatsPage() {
  const { shortId } = useParams<{ shortId: string }>();
  
  if (!shortId) {
    return <div className="text-center p-8">Invalid URL</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Analytics Dashboard</h1>
        <UrlStatsDashboard shortId={shortId} />
      </div>
    </div>
  );
}