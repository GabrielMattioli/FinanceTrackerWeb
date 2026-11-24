import React, { createContext, useState, useEffect, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { queryClient } from '../lib/queryClient';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data: { session: currentSession } }) => {
        if (!isMounted) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      })
      .catch((error: unknown) => {
        console.error('Error restoring Supabase session:', error);
        if (!isMounted) return;
        setSession(null);
        setUser(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div
        className="loading-page"
        style={{ height: '100dvh', background: 'var(--bg-primary)' }}
        role="status"
        aria-live="polite"
      >
        <span className="spinner" /> Carregando sessão...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, user, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
