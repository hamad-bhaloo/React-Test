
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeInput } from '@/utils/security';


interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        // Handle token refresh errors and expired sessions
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('Token refresh failed - session expired');
          setSession(null);
          setUser(null);
          setLoading(false);
          
          // Show error message for expired session
          const event = new CustomEvent('sessionExpired');
          window.dispatchEvent(event);
          
          // Redirect to login
          setTimeout(() => {
            window.location.href = '/auth';
          }, 100);
          return;
        }

        // Handle sign out events or invalid sessions
        if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
          console.log('User signed out or session invalid');
          setSession(null);
          setUser(null);
          setLoading(false);
          
          // Security: Clear sensitive data on sign out
          if (typeof window !== 'undefined') {
            // Clear any cached sensitive data
            sessionStorage.clear();
            // Keep only essential localStorage items
            const essentialKeys = ['theme', 'language'];
            const itemsToKeep: Record<string, string> = {};
            essentialKeys.forEach(key => {
              const value = localStorage.getItem(key);
              if (value) itemsToKeep[key] = value;
            });
            localStorage.clear();
            Object.entries(itemsToKeep).forEach(([key, value]) => {
              localStorage.setItem(key, value);
            });
          }
          
          // Redirect to login page after logout
          setTimeout(() => {
            window.location.href = '/auth';
          }, 100);
          return;
        }
        
        // Always update state first for valid sessions
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle email confirmation redirect and role-based routing
        if (event === 'SIGNED_IN' && session?.user) {
          // Track sign in event
          if (window.gtag) {
            window.gtag('event', 'login', {
              method: 'email',
              user_id: session.user.id
            });
          }

          // Check if this is from email confirmation
          const urlParams = new URLSearchParams(window.location.search);
          const accessToken = urlParams.get('access_token');
          const refreshToken = urlParams.get('refresh_token');
          
          // If we have tokens in URL, this is from email confirmation
          if (accessToken && refreshToken) {
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            // Small delay to ensure state is updated, then redirect to dashboard
            setTimeout(() => {
              window.location.href = '/';
            }, 100);
            return;
          }

          // Don't auto-redirect admin users - let React Router handle routing
          // Admin users will be properly routed by AdminRoute component
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());
      const sanitizedFullName = sanitizeInput(fullName.trim());
      
      // Basic validation
      if (!sanitizedEmail || !password || !sanitizedFullName) {
        return { error: { message: 'All fields are required' } };
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedEmail)) {
        return { error: { message: 'Invalid email format' } };
      }

      // Password strength validation
      if (password.length < 8) {
        return { error: { message: 'Password must be at least 8 characters long' } };
      }

      console.log('Attempting to sign up user:', sanitizedEmail);
      
      // Get the current domain for email redirect
      const currentDomain = window.location.origin;
      const redirectUrl = `${currentDomain}/auth`;
      
      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: sanitizedFullName,
          },
        },
      });
      
      console.log('Signup response:', { data, error });
      
      if (error) {
        console.error('Signup error:', error);
        
        // Handle specific error cases
        if (error.message.includes('User already registered')) {
          return { error: { message: 'An account with this email already exists. Please sign in instead.' } };
        }
        
        if (error.message.includes('already been registered')) {
          return { error: { message: 'An account with this email already exists. Please sign in instead.' } };
        }
        
        if (error.message.includes('Signup requires a valid password')) {
          return { error: { message: 'Please enter a valid password (minimum 8 characters)' } };
        }
        
        return { error };
      }
      
      // Check if the user was created (new user) or already existed
      if (data.user) {
        // If user exists but identities array is empty, it means the user already existed
        if (data.user.identities && data.user.identities.length === 0) {
          return { error: { message: 'An account with this email already exists. Please sign in instead.' } };
        }
        
        // Track sign up event
        if (window.gtag) {
          window.gtag('event', 'sign_up', {
            method: 'email',
            user_id: data.user.id
          });
        }
        
        // If signup was successful but no session was created, it means email confirmation is required (new user)
        if (!data.session) {
          return { error: null }; // This indicates successful signup requiring confirmation
        }
      }
      
      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: { message: 'An unexpected error occurred during signup' } };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Sanitize email input
      const sanitizedEmail = sanitizeInput(email.toLowerCase().trim());
      
      if (!sanitizedEmail || !password) {
        return { error: { message: 'Email and password are required' } };
      }

      console.log('Attempting to sign in user:', sanitizedEmail);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password,
      });
      
      console.log('Signin response:', { data, error });
      
      if (error) {
        console.error('Signin error:', error);
        
        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          return { error: { message: 'Invalid email or password. Please try again.' } };
        }
        
        if (error.message.includes('Email not confirmed')) {
          return { error: { message: 'Please check your email and confirm your account before signing in.' } };
        }
      }
      
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: { message: 'An unexpected error occurred' } };
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      console.log('Attempting to sign in with Google...');
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        }
      });
      
      console.log('Google signin response:', { data, error });
      
      if (error) {
        console.error('Google signin error:', error);
        setLoading(false);
        return { error };
      }
      
      // Track sign in event
      if (window.gtag) {
        window.gtag('event', 'login', {
          method: 'google'
        });
      }
      
      return { error: null };
    } catch (error) {
      console.error('Unexpected error during Google sign-in:', error);
      setLoading(false);
      return { error: { message: 'An unexpected error occurred during Google sign-in' } };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user...');
      // Clear local state first to prevent stale session issues
      setSession(null);
      setUser(null);
      
      // Clear localStorage and sessionStorage to remove any stale tokens
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        const essentialKeys = ['theme', 'language'];
        const itemsToKeep: Record<string, string> = {};
        essentialKeys.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) itemsToKeep[key] = value;
        });
        localStorage.clear();
        Object.entries(itemsToKeep).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
      }
      
      // Attempt to sign out from Supabase (this might fail with stale sessions)
      await supabase.auth.signOut();
      
      // Redirect to auth page
      window.location.href = '/auth';
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if logout fails, clear everything and redirect
      setSession(null);
      setUser(null);
      window.location.href = '/auth';
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
