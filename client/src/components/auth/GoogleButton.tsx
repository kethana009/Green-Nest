'use client';
import { supabase } from '@/lib/supabase/client';

export function GoogleButton() {

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full py-3 rounded-xl glass-card border border-white/20
        flex items-center justify-center gap-3 hover:border-brand-mint/40
        transition-all duration-300 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-brand-mint"
    >
      {/* Google SVG Icon */}
      <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0">
        <path fill="#4285F4" d="M17.64 9.2a10 10 0 0 0-.16-1.74H9v3.28h4.84a4.13 4.13 0 0 1-1.8 2.72v2.26h2.9A8.78 8.78 0 0 0 17.64 9.2z"/>
        <path fill="#34A853" d="M9 18a8.6 8.6 0 0 0 5.96-2.18l-2.9-2.26A5.4 5.4 0 0 1 9 14.5a5.4 5.4 0 0 1-5.09-3.74H.94v2.34A9 9 0 0 0 9 18z"/>
        <path fill="#FBBC05" d="M3.91 10.76A5.4 5.4 0 0 1 3.63 9c0-.61.1-1.2.28-1.76V4.9H.94A9 9 0 0 0 0 9c0 1.45.34 2.82.94 4.1z"/>
        <path fill="#EA4335" d="M9 3.5A4.87 4.87 0 0 1 12.44 4.9l2.57-2.57A8.65 8.65 0 0 0 9 0 9 9 0 0 0 .94 4.9l2.97 2.34A5.4 5.4 0 0 1 9 3.5z"/>
      </svg>
      Continue with Google
    </button>
  );
}
