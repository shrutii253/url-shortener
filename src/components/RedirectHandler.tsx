import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { urlService } from '../services/urlService';

console.log('RedirectHandler mounted'); // Debug log to check if component is loaded

export default function RedirectHandler() {
  const { shortId } = useParams<{ shortId: string }>();
  console.log('RedirectHandler shortId:', shortId); // Log shortId value
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [originalUrl, setOriginalUrl] = useState<string>('');

  useEffect(() => {
    console.log('useEffect shortId:', shortId); // Log shortId inside useEffect
    const handleRedirect = async () => {
      if (!shortId) {
        setStatus('error');
        return;
      }

      try {
        const longUrl = await urlService.getOriginalUrl(shortId);
        console.log('RedirectHandler: getOriginalUrl result', { shortId, longUrl }); // Debug log
        if (longUrl) {
          setOriginalUrl(longUrl);
          setStatus('redirecting');
          // Add a small delay so users can see the redirect message
          setTimeout(() => {
            window.location.href = longUrl;
          }, 2000);
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Redirect error:', error);
        setStatus('error');
      }
    };

    handleRedirect();
  }, [shortId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Dots Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* You can reuse the Particles component from UrlForm if you want the same effect */}
        </div>
        <div className="bg-[#18181b] border border-[#232323] rounded-2xl shadow-xl p-8 text-center z-10">
          <Loader2 className="w-12 h-12 text-[#6e5cff] animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading...</h2>
          <p className="text-gray-400">Finding your destination</p>
        </div>
      </div>
    );
  }

  if (status === 'redirecting') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* You can reuse the Particles component from UrlForm if you want the same effect */}
        </div>
        <div className="bg-[#18181b] border border-[#232323] rounded-2xl shadow-xl p-8 text-center z-10">
          <ExternalLink className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Redirecting...</h2>
          <p className="text-gray-400 mb-4">Taking you to:</p>
          <p className="text-[#6e5cff] font-mono break-all bg-[#232323] p-3 rounded-lg">
            {originalUrl}
          </p>
          <p className="text-sm text-gray-500 mt-4">
            If you're not redirected automatically,
            <a href={originalUrl} className="text-[#6e5cff] hover:underline ml-1">
              click here
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* You can reuse the Particles component from UrlForm if you want the same effect */}
      </div>
      <div className="bg-[#18181b] border border-[#232323] rounded-2xl shadow-xl p-8 text-center z-10">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Link Not Found</h2>
        <p className="text-gray-400 mb-6">
          The short URL you're looking for doesn't exist or has expired.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#6e5cff] text-white font-semibold rounded-xl hover:bg-[#a855f7] transition-all duration-200"
        >
          Create a new short URL
        </a>
      </div>
    </div>
  );
}