import { useEffect, useState } from 'react';

export default function OAuthDebugBanner() {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    const attempt = localStorage.getItem('oauth_attempt');
    const hash = window.location.hash;
    const hasTokens = /access_token=/.test(hash);
    if (!attempt) return;
    const ts = parseInt(attempt.split(':')[1] || '0', 10);
    const age = Date.now() - ts;
    // Only show if attempt older than 6s and no tokens
    if (!hasTokens && age > 6000) {
      setInfo({ attempt, age, hashLength: hash.length });
    }
  }, []);
  if (!info) return null;
  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[120] bg-yellow-100 border border-yellow-400 text-yellow-900 text-xs px-3 py-2 rounded shadow">
      <div className="font-semibold mb-0.5">OAuth Debug</div>
      <div>No tokens returned for attempt: {info.attempt}</div>
      <div>URL hash length: {info.hashLength} (expected &gt; 50 if tokens)</div>
      <div className="mt-1">Verify GitHub Authorization callback URL is <code>https://gejhfuijrjladkkgufie.supabase.co/auth/v1/callback</code></div>
      <button
        onClick={() => { localStorage.removeItem('oauth_attempt'); setInfo(null); }}
        className="mt-1 underline"
      >Dismiss</button>
    </div>
  );
}
