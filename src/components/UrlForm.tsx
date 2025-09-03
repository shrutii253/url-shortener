import React, { useState } from 'react';
import { Link, Copy, Check, AlertCircle, Zap } from 'lucide-react';
import { urlService } from '../services/urlService';
import type { ShortenUrlResponse } from '../services/urlService';
import Particles from 'react-tsparticles';

export default function UrlForm() {
  const [longUrl, setLongUrl] = useState('');
  const [result, setResult] = useState<ShortenUrlResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await urlService.shortenUrl(longUrl);
      setResult(response);
      setLongUrl('');
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
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Dots Background */}
      <Particles
        className="absolute inset-0 z-0"
        options={{
          background: { color: { value: '#0a0a0a' } },
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
          <Zap className="w-8 h-8 text-white" />
          <span className="text-2xl font-bold text-white tracking-tight">Snipr</span>
        </div>
      </header>
      {/* Card */}
      <main className="w-full max-w-2xl mx-auto z-10">
        <div className="bg-[#18181b] border border-[#232323] rounded-2xl shadow-xl p-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="url" className="block text-sm font-medium text-gray-300">Paste your URL</label>
              <div className="relative">
                <Link className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="url"
                  id="url"
                  value={longUrl}
                  onChange={(e) => setLongUrl(e.target.value)}
                  placeholder="https://example.com/url/path"
                  className="w-full pl-12 pr-4 py-4 bg-[#232323] border border-[#232323] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6e5cff] focus:border-transparent text-lg text-white placeholder-gray-500"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !longUrl.trim()}
              className="w-full py-4 px-6 bg-gradient-to-r from-[#6e5cff] to-[#a855f7] text-white font-semibold rounded-xl hover:from-[#7c6aff] hover:to-[#b573f7] focus:outline-none focus:ring-2 focus:ring-[#6e5cff] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
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
            <div className="mt-6 p-4 bg-[#2a1a1a] border border-red-500 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-400">{error}</p>
            </div>
          )}
          {/* Result Display */}
          {result && (
            <div className="mt-8 space-y-4">
              <div className="text-center">
                <p className="text-gray-400 font-medium mb-3">Your shortened URL:</p>
                <div className="p-6 bg-[#232323] border border-[#232323] rounded-xl">
                  <div className="flex items-center justify-between gap-4">
                    <a
                      href={result.shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 text-[#6e5cff] hover:text-[#a855f7] font-mono text-lg font-medium break-all transition-colors duration-200"
                    >
                      {result.shortUrl}
                    </a>
                    <button
                      onClick={handleCopy}
                      className="flex-shrink-0 p-3 bg-[#6e5cff] hover:bg-[#a855f7] text-white rounded-lg transition-all duration-200"
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
                  className="px-6 py-2 text-[#6e5cff] hover:text-[#a855f7] font-medium transition-colors duration-200"
                >
                  Shorten another URL
                </button>
              </div>
            </div>
          )}
          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#232323] text-center">
            <p className="text-gray-500 text-sm">Powered by Supabase • Fast, secure, and reliable</p>
          </div>
        </div>
      </main>
    </div>
  );
}