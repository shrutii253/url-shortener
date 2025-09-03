import React, { useState } from 'react';
import { Link, Copy, Check, AlertCircle, Zap } from 'lucide-react';
import { urlService } from '../services/urlService';
import type { ShortenUrlResponse } from '../services/urlService';
import Particles from 'react-tsparticles';

export default function UrlForm() {
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [result, setResult] = useState<ShortenUrlResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await urlService.shortenUrl(longUrl, customAlias);
      setResult(response);
      setLongUrl('');
      setCustomAlias('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to shorten URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result) {
      try {
        await navigator.clipboard.writeText(result.shortUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const resetForm = () => {
    setResult(null);
    setError('');
    setCopied(false);
  };

  return (
    <div
      className={
        `min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden ` +
        (theme === 'dark'
          ? 'bg-[#0a0a0a]'
          : 'bg-white')
      }
    >
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
      {/* Header */}
      <header className="w-full max-w-2xl mx-auto flex items-center justify-between py-8 z-10">
        <div className="flex items-center gap-2">
          <Zap className={theme === 'dark' ? 'w-8 h-8 text-white' : 'w-8 h-8 text-[#6e5cff]'} />
          <span className={theme === 'dark' ? 'text-2xl font-bold text-white tracking-tight' : 'text-2xl font-bold text-[#6e5cff] tracking-tight'}>Snipr</span>
        </div>
        <button
          onClick={toggleTheme}
          className={
            'px-4 py-2 rounded-lg font-medium transition-colors duration-200 border ' +
            (theme === 'dark'
              ? 'bg-[#232323] text-white border-[#232323] hover:bg-[#18181b]'
              : 'bg-[#f3f3f3] text-[#6e5cff] border-[#6e5cff] hover:bg-[#e0e0ff]')
          }
          title="Toggle theme"
        >
          {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>
      {/* Card */}
      <main className={theme === 'dark' ? 'w-full max-w-2xl mx-auto z-10' : 'w-full max-w-2xl mx-auto z-10'}>
        <div className={
          (theme === 'dark'
            ? 'bg-[#18181b] border border-[#232323]'
            : 'bg-[#f8f8ff] border border-[#e0e0ff]') +
          ' rounded-2xl shadow-xl p-8'
        }>
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="url" className={theme === 'dark' ? 'block text-sm font-medium text-gray-300' : 'block text-sm font-medium text-[#6e5cff]'}>Paste your URL</label>
              <div className="relative">
                <Link className={theme === 'dark' ? 'absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5' : 'absolute left-4 top-1/2 transform -translate-y-1/2 text-[#6e5cff] w-5 h-5'} />
                <input
                  type="url"
                  id="url"
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  placeholder="https://example.com/url/path"
                  className={
                    (theme === 'dark'
                      ? 'w-full pl-12 pr-4 py-4 bg-[#232323] border border-[#232323] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6e5cff] focus:border-transparent text-lg text-white placeholder-gray-500'
                      : 'w-full pl-12 pr-4 py-4 bg-white border border-[#e0e0ff] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6e5cff] focus:border-transparent text-lg text-[#232323] placeholder-[#6e5cff]')
                  }
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="customAlias" className={theme === 'dark' ? 'block text-sm font-medium text-gray-300' : 'block text-sm font-medium text-[#6e5cff]'}>Custom Alias <span className={theme === 'dark' ? 'text-gray-500' : 'text-[#6e5cff]'}>(optional)</span></label>
              <input
                type="text"
                id="customAlias"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                placeholder="e.g. hello-world"
                className={
                  (theme === 'dark'
                    ? 'w-full pl-4 pr-4 py-4 bg-[#232323] border border-[#232323] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6e5cff] focus:border-transparent text-lg text-white placeholder-gray-500'
                    : 'w-full pl-4 pr-4 py-4 bg-white border border-[#e0e0ff] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6e5cff] focus:border-transparent text-lg text-[#232323] placeholder-[#6e5cff]')
                }
                disabled={isLoading}
                maxLength={32}
                pattern="^[a-zA-Z0-9\-_.]+$"
                title="Letters, numbers, dashes, underscores, and dots only"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !longUrl.trim()}
              className={
                (theme === 'dark'
                  ? 'w-full py-4 px-6 bg-gradient-to-r from-[#382d88] to-[#b50b9f] text-white font-semibold rounded-xl hover:from-[#7c6aff] hover:to-[#b573f7] focus:outline-none focus:ring-2 focus:ring-[#6e5cff] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg'
                  : 'w-full py-4 px-6 bg-gradient-to-r from-[#6e5cff] to-[#a855f7] text-white font-semibold rounded-xl hover:from-[#7c6aff] hover:to-[#b573f7] focus:outline-none focus:ring-2 focus:ring-[#6e5cff] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg')
              }
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Shortening...
                </div>
              ) : (
                'Shorten URL'
              )}
            </button>
          </form>
          {/* Error Display */}
          {error && (
            <div className={
              (theme === 'dark'
                ? 'mt-6 p-4 bg-[#2a1a1a] border border-red-500 rounded-xl flex items-center gap-3'
                : 'mt-6 p-4 bg-[#ffeaea] border border-red-500 rounded-xl flex items-center gap-3')
            }>
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-400">{error}</p>
            </div>
          )}
          {/* Result Display */}
          {result && (
            <div className="mt-8 space-y-4">
              <div className="text-center">
                <p className={theme === 'dark' ? 'text-gray-400 font-medium mb-3' : 'text-[#6e5cff] font-medium mb-3'}>Your shortened URL:</p>
                <div className={theme === 'dark' ? 'p-6 bg-[#232323] border border-[#232323] rounded-xl' : 'p-6 bg-white border border-[#e0e0ff] rounded-xl'}>
                  <div className="flex items-center justify-between gap-4">
                    <a
                      href={result.shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={
                        (theme === 'dark'
                          ? 'flex-1 text-[#6e5cff] hover:text-[#a855f7] font-mono text-lg font-medium break-all transition-colors duration-200'
                          : 'flex-1 text-[#6e5cff] hover:text-[#a855f7] font-mono text-lg font-medium break-all transition-colors duration-200')
                      }
                    >
                      {result.shortUrl}
                    </a>
                    <button
                      onClick={handleCopy}
                      className={
                        (theme === 'dark'
                          ? 'flex-shrink-0 p-3 bg-[#6e5cff] hover:bg-[#a855f7] text-white rounded-lg transition-all duration-200'
                          : 'flex-shrink-0 p-3 bg-[#6e5cff] hover:bg-[#a855f7] text-white rounded-lg transition-all duration-200')
                      }
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <button
                  onClick={resetForm}
                  className={theme === 'dark' ? 'px-6 py-2 text-[#6e5cff] hover:text-[#a855f7] font-medium transition-colors duration-200' : 'px-6 py-2 text-[#6e5cff] hover:text-[#a855f7] font-medium transition-colors duration-200'}
                >
                  Shorten another URL
                </button>
              </div>
            </div>
          )}
          {/* Footer */}
          <div className={theme === 'dark' ? 'mt-8 pt-6 border-t border-[#232323] text-center' : 'mt-8 pt-6 border-t border-[#e0e0ff] text-center'}>
            <p className={theme === 'dark' ? 'text-gray-500 text-sm' : 'text-[#6e5cff] text-sm'}>Powered by Supabase • Fast, secure, and reliable</p>
          </div>
        </div>
      </main>
    </div>
  );
}