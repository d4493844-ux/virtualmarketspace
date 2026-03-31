import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, type User } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  demoLogin: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('vms-demo-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const refreshUser = async () => {
    if (!user) return;
    
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && userData) {
      setUser(userData as User);
      localStorage.setItem('vms-demo-user', JSON.stringify(userData));
    }
  };

  const demoLogin = async (email: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('User not found');

    setUser(data as User);
    localStorage.setItem('vms-demo-user', JSON.stringify(data));
  };

  // FIX 10: errors now always surface properly to the UI — no silent failures
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (userError) throw userError;
      if (!userData) throw new Error('User profile not found. Please contact support.');

      setUser(userData as User);
      localStorage.setItem('vms-demo-user', JSON.stringify(userData));
    } catch (err) {
      setLoading(false);
      throw err;
    }
    setLoading(false);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData?.user) throw new Error('Failed to create account. Please try again.');

      // If email confirmation is required, user.identities will be empty or
      // the session will be null — insert profile row regardless
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email,
            display_name: displayName,
            is_verified: false,
            is_seller: false,
            is_admin: false,
            is_rider: false,
            follower_count: 0,
            following_count: 0,
          },
        ])
        .select()
        .single();

      if (userError) {
        // If profile insert fails (e.g. duplicate), still show success for email verification
        console.error('Profile insert error:', userError);
        throw new Error('Account created! Please check your email to verify, then sign in.');
      }

      setUser(userData as User);
      localStorage.setItem('vms-demo-user', JSON.stringify(userData));
    } catch (err) {
      setLoading(false);
      throw err;
    }
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('vms-demo-user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, demoLogin, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
