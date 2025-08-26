import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setupMFA: () => Promise<{ qr_code: string; secret: string }>;
  verifyMFA: (token: string, factorId: string) => Promise<void>;
  challengeMFA: (factorId: string) => Promise<string>;
  verifyMFAChallenge: (challengeId: string, code: string) => Promise<void>;
  getMFAFactors: () => Promise<any[]>;
  unenrollMFA: (factorId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const setupMFA = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });
    if (error) throw error;
    return {
      qr_code: data.totp.qr_code,
      secret: data.totp.secret,
    };
  };

  const verifyMFA = async (token: string, factorId: string) => {
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: '', // This will be provided during challenge
      code: token,
    });
    if (error) throw error;
  };

  const challengeMFA = async (factorId: string) => {
    const { data, error } = await supabase.auth.mfa.challenge({
      factorId,
    });
    if (error) throw error;
    return data.id;
  };

  const verifyMFAChallenge = async (challengeId: string, code: string) => {
    const { error } = await supabase.auth.mfa.verify({
      factorId: '', // Will be determined from challenge
      challengeId,
      code,
    });
    if (error) throw error;
  };

  const getMFAFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    return data.totp || [];
  };

  const unenrollMFA = async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({
      factorId,
    });
    if (error) throw error;
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    setupMFA,
    verifyMFA,
    challengeMFA,
    verifyMFAChallenge,
    getMFAFactors,
    unenrollMFA,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};