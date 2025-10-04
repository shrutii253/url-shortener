import React, { useState, useEffect } from 'react';
import { BarChart3, Globe, MapPin, Calendar, TrendingUp, Users, X } from 'lucide-react';
import { urlService } from '../services/urlService';

interface AnalyticsProps {
  alias: string;
  onClose: () => void;
}

export default function Analytics({ alias, onClose }: AnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const data = await urlService.getAnalytics(alias);
      setAnalytics(data);
      setLoading(false);
    };
    fetchAnalytics();
  }, [alias]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-[#18181b] to-[#0f0f0f] border border-[#333] rounded-3xl p-8 shadow-2xl">
          <div className="w-10 h-10 border-3 border-[#6e5cff] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-300 mt-4 text-center">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gradient-to-br from-[#18181b] to-[#0f0f0f] border border-[#333] rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-white text-lg mb-4">No analytics data found</p>
          <button onClick={onClose} className="px-6 py-3 bg-[#6e5cff] hover:bg-[#5a4bcc] text-white rounded-xl transition-all duration-200 font-medium">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#18181b] to-[#0f0f0f] border border-[#333] rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#6e5cff] to-[#a855f7] rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              Analytics Dashboard
            </h2>
            <p className="text-gray-400 mt-1">Insights for <span className="text-[#6e5cff] font-mono">/{alias}</span></p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 bg-[#232323] hover:bg-[#333] rounded-xl flex items-center justify-center transition-colors duration-200 group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-white" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#232323] to-[#1a1a1a] rounded-2xl p-6 border border-[#333]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{analytics.totalClicks}</div>
            <div className="text-gray-400 text-sm font-medium">Total Clicks</div>
          </div>
          
          <div className="bg-gradient-to-br from-[#232323] to-[#1a1a1a] rounded-2xl p-6 border border-[#333]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{analytics.uniqueCountries}</div>
            <div className="text-gray-400 text-sm font-medium">Countries Reached</div>
          </div>
          
          <div className="bg-gradient-to-br from-[#232323] to-[#1a1a1a] rounded-2xl p-6 border border-[#333]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{analytics.clickLogs.length}</div>
            <div className="text-gray-400 text-sm font-medium">Total Visits</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Countries */}
          {analytics.topCountries.length > 0 && (
            <div className="bg-gradient-to-br from-[#232323] to-[#1a1a1a] rounded-2xl p-6 border border-[#333]">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <Globe className="w-5 h-5 text-[#6e5cff]" />
                Top Countries
              </h3>
              <div className="space-y-3">
                {analytics.topCountries.map((country: any, i: number) => {
                  const percentage = (country.count / analytics.totalClicks * 100).toFixed(1);
                  return (
                    <div key={i} className="relative">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">{country.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#6e5cff] font-bold">{country.count}</span>
                          <span className="text-gray-400 text-sm">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#6e5cff] to-[#a855f7] h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Cities */}
          {analytics.topCities.length > 0 && (
            <div className="bg-gradient-to-br from-[#232323] to-[#1a1a1a] rounded-2xl p-6 border border-[#333]">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#6e5cff]" />
                Top Cities
              </h3>
              <div className="space-y-3">
                {analytics.topCities.map((city: any, i: number) => {
                  const percentage = (city.count / analytics.totalClicks * 100).toFixed(1);
                  return (
                    <div key={i} className="relative">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">{city.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#6e5cff] font-bold">{city.count}</span>
                          <span className="text-gray-400 text-sm">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#6e5cff] to-[#a855f7] h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-gradient-to-br from-[#232323] to-[#1a1a1a] rounded-2xl p-6 border border-[#333]">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-[#6e5cff]" />
            Recent Activity
          </h3>
          <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
            {analytics.clickLogs.slice(0, 15).map((log: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] hover:border-[#333] transition-colors duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-[#6e5cff] rounded-full animate-pulse"></div>
                  <div>
                    <div className="text-white font-medium">{log.country || 'Unknown'} • {log.city || 'Unknown'}</div>
                    <div className="text-gray-400 text-sm">{new Date(log.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-[#6e5cff] text-sm font-mono bg-[#6e5cff]/10 px-3 py-1 rounded-lg">
                  Click #{analytics.clickLogs.length - i}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}