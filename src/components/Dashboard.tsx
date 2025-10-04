import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, User, LogOut, BarChart3, ExternalLink, Calendar, MousePointer } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { urlService } from '../services/urlService';
import type { UrlRecord } from '../lib/supabase';
import Analytics from './Analytics';
import Particles from 'react-tsparticles';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [urls, setUrls] = useState<UrlRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    loadUserUrls();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const loadUserUrls = async () => {
    try {
      const userUrls = await urlService.getUserUrls();
      setUrls(userUrls);
    } catch (error) {
      console.error('Failed to load URLs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (url: UrlRecord) => {
    return url.custom_alias || url.short_id;
  };

  const getShortUrl = (url: UrlRecord) => {
    const alias = url.custom_alias || url.short_id;
    const domain = window.location.hostname === 'localhost' 
      ? 'https://your-vercel-domain.vercel.app' 
      : window.location.origin;
    return `${domain}/${alias}`;
  };

  if (selectedUrl) {
    return (
      <div className={
        `min-h-screen px-4 py-8 ` +
        (theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white')
      }>
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setSelectedUrl(null)}
            className={
              'mb-6 flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors duration-200 ' +
              (theme === 'dark'
                ? 'bg-[#232323] text-white border border-[#232323] hover:bg-[#18181b]'
                : 'bg-[#f3f3f3] text-[#6e5cff] border border-[#6e5cff] hover:bg-[#e0e0ff]')
            }
          >
            ← Back to Dashboard
          </button>
          <Analytics alias={selectedUrl} onClose={() => setSelectedUrl(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className={
      `min-h-screen px-4 py-8 relative overflow-hidden ` +
      (theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white')
    }>
      {/* Animated Dots Background */}
      <Particles
        className="absolute inset-0 z-0"
        options={{
          background: { color: { value: theme === 'dark' ? '#0a0a0a' : '#fff' } },
          fpsLimit: 60,
          particles: {
            color: { value: '#6e5cff' },
            links: { enable: false },
            move: { enable: true, speed: 1, direction: 'none', outModes: { default: 'bounce' } },
            number: { value: 40 },
            opacity: { value: 0.5 },
            shape: { type: 'circle' },
            size: { value: { min: 2, max: 4 } },
          },
          detectRetina: true,
        }}
      />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Zap className={theme === 'dark' ? 'w-8 h-8 text-white' : 'w-8 h-8 text-[#6e5cff]'} />
            <span className={theme === 'dark' ? 'text-2xl font-bold text-white tracking-tight' : 'text-2xl font-bold text-[#6e5cff] tracking-tight'}>Snipr Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={
                'px-4 py-2 rounded-lg font-medium transition-colors duration-200 border ' +
                (theme === 'dark'
                  ? 'bg-[#232323] text-white border-[#232323] hover:bg-[#18181b]'
                  : 'bg-[#f3f3f3] text-[#6e5cff] border-[#6e5cff] hover:bg-[#e0e0ff]')
              }
            >
              {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </button>
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={
                  'w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 ' +
                  (theme === 'dark'
                    ? 'bg-[#232323] text-white hover:bg-[#18181b]'
                    : 'bg-[#f3f3f3] text-[#6e5cff] hover:bg-[#e0e0ff]')
                }
              >
                <User className="w-5 h-5" />
              </button>
              {showUserMenu && (
                <div className={
                  'absolute right-0 mt-2 w-48 rounded-xl shadow-lg border z-50 ' +
                  (theme === 'dark'
                    ? 'bg-[#232323] border-[#333]'
                    : 'bg-white border-[#e0e0ff]')
                }>
                  <div className="p-3 border-b border-gray-600">
                    <p className={theme === 'dark' ? 'text-gray-300 text-sm truncate' : 'text-[#6e5cff] text-sm truncate'}>{user?.email}</p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await signOut();
                        setShowUserMenu(false);
                        navigate('/auth');
                      } catch (error) {
                        console.error('Sign out error:', error);
                      }
                    }}
                    className={
                      'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors duration-200 ' +
                      (theme === 'dark'
                        ? 'text-red-400 hover:bg-[#18181b]'
                        : 'text-red-500 hover:bg-[#f3f3f3]')
                    }
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className={
          (theme === 'dark'
            ? 'bg-[#18181b] border border-[#232323]'
            : 'bg-[#f8f8ff] border border-[#e0e0ff]') +
          ' rounded-2xl shadow-xl p-8'
        }>
          <div className="flex items-center justify-between mb-6">
            <h1 className={theme === 'dark' ? 'text-2xl font-bold text-white' : 'text-2xl font-bold text-[#6e5cff]'}>My Links</h1>
            <a
              href="/"
              className={
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ' +
                (theme === 'dark'
                  ? 'bg-gradient-to-r from-[#6e5cff] to-[#a855f7] text-white hover:from-[#7c6aff] hover:to-[#b573f7]'
                  : 'bg-gradient-to-r from-[#6e5cff] to-[#a855f7] text-white hover:from-[#7c6aff] hover:to-[#b573f7]')
              }
            >
              Create New Link
            </a>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-[#6e5cff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-[#6e5cff]'}>Loading your links...</p>
            </div>
          ) : urls.length === 0 ? (
            <div className="text-center py-12">
              <User className={theme === 'dark' ? 'w-16 h-16 text-gray-500 mx-auto mb-4' : 'w-16 h-16 text-[#6e5cff] mx-auto mb-4'} />
              <p className={theme === 'dark' ? 'text-gray-300 text-lg mb-2' : 'text-[#6e5cff] text-lg mb-2'}>No links created yet</p>
              <p className={theme === 'dark' ? 'text-gray-500' : 'text-[#6e5cff] opacity-70'}>Create your first short link to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {urls.map((url) => (
                <div
                  key={url.id}
                  className={
                    (theme === 'dark'
                      ? 'bg-[#232323] border border-[#232323]'
                      : 'bg-white border border-[#e0e0ff]') +
                    ' rounded-xl p-6 hover:shadow-lg transition-all duration-200'
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <a
                          href={getShortUrl(url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#6e5cff] hover:text-[#a855f7] font-mono text-lg font-medium transition-colors duration-200 flex items-center gap-2"
                        >
                          {getDisplayName(url)}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      <p className={theme === 'dark' ? 'text-gray-300 text-sm truncate' : 'text-[#232323] text-sm truncate'}>
                        {url.long_url}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-1">
                          <MousePointer className={theme === 'dark' ? 'w-4 h-4 text-gray-500' : 'w-4 h-4 text-[#6e5cff]'} />
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-[#6e5cff] opacity-70'}>{url.clicks || 0} clicks</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className={theme === 'dark' ? 'w-4 h-4 text-gray-500' : 'w-4 h-4 text-[#6e5cff]'} />
                          <span className={theme === 'dark' ? 'text-gray-400' : 'text-[#6e5cff] opacity-70'}>{new Date(url.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedUrl(getDisplayName(url))}
                      className={
                        'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ' +
                        (theme === 'dark'
                          ? 'bg-[#6e5cff] hover:bg-[#a855f7] text-white'
                          : 'bg-[#6e5cff] hover:bg-[#a855f7] text-white')
                      }
                    >
                      <BarChart3 className="w-4 h-4" />
                      Analytics
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}