import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User, Session } from '@supabase/supabase-js';

interface ExtendedUser extends User {
  role?: string;
}

// Create the client ONCE at module scope
const supabase = createClientComponentClient();

export function useAuth() {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Debug: log cookies and localStorage
    console.log('Cookies:', document.cookie);
    console.log('localStorage:', window.localStorage);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setUser({
          ...session.user,
          role: userData?.role || 'user'
        });
      } else {
        setUser(null);
      }
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setUser({
          ...session.user,
          role: userData?.role || 'user'
        });
      } else {
        setUser(null);
      }
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    session,
    loading,
  };
} 