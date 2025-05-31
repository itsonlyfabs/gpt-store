import { createClient } from '@supabase/supabase-js';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: {
        getItem: (key: string) => {
          if (typeof window === 'undefined') return null;
          try {
            const item = window.localStorage.getItem(key);
            if (!item) {
              // Try to get from cookies as fallback
              const cookies = document.cookie.split(';');
              const cookie = cookies.find(c => c.trim().startsWith(`${key}=`));
              if (cookie) {
                const value = cookie.split('=')[1];
                return value ? decodeURIComponent(value) : null;
              }
            }
            return item;
          } catch (error) {
            console.error('Error reading from storage:', error);
            return null;
          }
        },
        setItem: (key: string, value: string) => {
          if (typeof window === 'undefined') return;
          try {
            window.localStorage.setItem(key, value);
            // Also set as cookie as backup
            document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
          } catch (error) {
            console.error('Error writing to storage:', error);
          }
        },
        removeItem: (key: string) => {
          if (typeof window === 'undefined') return;
          try {
            window.localStorage.removeItem(key);
            // Also remove from cookies
            document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          } catch (error) {
            console.error('Error removing from storage:', error);
          }
        },
      },
    },
  }
);

// Add a listener for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session?.user?.email || 'no session');
}); 