import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useAnalytics } from '../hooks/useAnalytics';

interface AnalyticsDashboardProps {
  shortId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AnalyticsDashboard({ shortId }: AnalyticsDashboardProps) {
  const { analytics, loading } = useAnalytics(shortId);

  if (loading) {
    return <div className="text-center p-8">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center p-8 text-red-500">No analytics data found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-600">Total Clicks</h3>
          <p className="text-2xl font-bold text-blue-900">{analytics.total_clicks}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-600">Unique Visitors</h3>
          <p className="text-2xl font-bold text-green-900">{analytics.unique_visitors}</p>
        </div>
      </div>

      {/* Daily Clicks Chart */}
      {analytics.daily_clicks.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Daily Clicks (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analytics.daily_clicks}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="clicks" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Countries */}
        {analytics.top_countries.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Top Countries</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={analytics.top_countries}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ country, percent }) => `${country} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.top_countries.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Browsers */}
        {analytics.top_browsers.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Top Browsers</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.top_browsers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="browser" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}