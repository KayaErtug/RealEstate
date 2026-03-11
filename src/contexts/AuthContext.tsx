// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'super_admin' | 'user';

export interface UserProfile {
  user_id: string;
  email: string | null;
  display_name: string | null;
  phone: string | null;
  role: UserRole;
}

const SUPER_ADMIN_EMAILS = ['MustafaErtugKaya@gmail.com', 'umaykutay@gmail.com'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isSuperAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (_email: string, _password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateMyProfile: (payload: {
    display_name?: string;
    phone?: string;
  }) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadProfile(session.user);
      } else {
        setProfile(null);
        setIsSuperAdmin(false);
      }

      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadProfile(session.user);
        } else {
          setProfile(null);
          setIsSuperAdmin(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (u: User) => {
    const email = (u.email ?? '').toLowerCase();
    const superByEmail = SUPER_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id,email,display_name,phone,role')
        .eq('user_id', u.id)
        .maybeSingle();

      if (error) {
        setProfile(null);
        setIsSuperAdmin(superByEmail);
        return;
      }

      const p = data as UserProfile | null;
      setProfile(p);
      setIsSuperAdmin(superByEmail || p?.role === 'super_admin');
    } catch {
      setProfile(null);
      setIsSuperAdmin(superByEmail);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (_email: string, _password: string) => {
    return {
      error: new Error('Kayıt kapalı. Hesaplar sadece davetiye/izin ile açılır.'),
    };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateMyProfile = async (payload: { display_name?: string; phone?: string }) => {
    if (!user) {
      return { error: new Error('Oturum bulunamadı.') };
    }

    try {
      const { error } = await supabase.from('profiles').upsert(
        {
          user_id: user.id,
          email: user.email,
          ...payload,
        },
        { onConflict: 'user_id' }
      );

      if (error) {
        return { error };
      }

      await loadProfile(user);
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isSuperAdmin,
        loading,
        signIn,
        signUp,
        signOut,
        updateMyProfile,
      }}
    >
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