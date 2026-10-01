'use client';

import React, { createContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AUTH_COOKIE_NAME } from '@/lib/auth-cookie';
import { useRouter } from 'next/navigation';
import { LoginModal } from '@/components/modals/log-in-modal';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  token: string | null;
  loading: boolean;
  isSigningOut: boolean;
  signOut: (redirectTo?: string) => Promise<void>;
  refreshSession: () => Promise<Session | null>;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

export function openLoginModal(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('closeai-open-login'));
}

export function closeLoginModal(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('closeai-close-login'));
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  token: null,
  loading: true,
  isSigningOut: false,
  signOut: async (_redirectTo?: string) => { },
  refreshSession: async () => null,
  openLoginModal: () => { },
  closeLoginModal: () => { },
});

export function hasActiveAuthCookie(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const part = cookies[i].trim();
      const eqIdx = part.indexOf('=');
      if (eqIdx === -1) continue;
      const name = part.substring(0, eqIdx).trim();
      const val = part.substring(eqIdx + 1).trim();

      // Exclude PKCE code verifier, csrf, etc.
      if (name.includes('code-verifier') || name.includes('csrf') || name.includes('state')) {
        continue;
      }

      // Check if it's the closeai-access or sb-* auth cookie
      const isAuthCookie =
        name === AUTH_COOKIE_NAME ||
        name.startsWith(`${AUTH_COOKIE_NAME}.`) ||
        name.includes('auth-token');

      if (isAuthCookie) {
        // An active Supabase auth token session string is always > 30 characters
        if (val && val.length > 30 && val !== 'deleted') {
          return true;
        }
      }
    }
  } catch (e) {
    return false;
  }
  return false;
}

export function AuthProvider({
  children,
  initialUser = null,
  initialHasAuth = false,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
  initialHasAuth?: boolean;
}) {
  const [user, setUser] = useState<User | null>(initialUser ?? null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const profileCheckedRef = useRef<string | null>(null);
  const isSigningOutRef = useRef(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const ensureProfile = useCallback(async (currentUser: User) => {
    if (!currentUser?.id || profileCheckedRef.current === currentUser.id) return;
    profileCheckedRef.current = currentUser.id;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, avatar_url, name')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (profile) {
        const updates: Record<string, any> = {};
        if (profile.avatar_url && profile.avatar_url !== currentUser.user_metadata?.avatar_url) {
          updates.avatar_url = profile.avatar_url;
        }
        if (profile.name && (profile.name !== currentUser.user_metadata?.name || profile.name !== currentUser.user_metadata?.full_name)) {
          updates.name = profile.name;
          updates.full_name = profile.name;
        }
        if (Object.keys(updates).length > 0) {
          await supabase.auth.updateUser({
            data: updates,
          });
        }
      } else if (currentUser.email) {
        const name = currentUser.user_metadata?.full_name || 
                     currentUser.user_metadata?.name || 
                     currentUser.user_metadata?.user_name ||
                     currentUser.email?.split('@')[0] || '';
        const avatarUrl = currentUser.user_metadata?.avatar_url || 
                          currentUser.user_metadata?.picture || null;

        await supabase.from('profiles').upsert({
          id: currentUser.id,
          email: currentUser.email,
          name: name,
          avatar_url: avatarUrl,
          plan: 'free',
          subscription_status: 'inactive',
        }, { onConflict: 'id' });
      }
    } catch (error) {
      console.error('Error ensuring profile in AuthProvider:', error);
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<Session | null> => {
    try {
      const { data: { user: latestUser } } = await supabase.auth.getUser();
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (!error && currentSession) {
        const updatedSession = latestUser
          ? { ...currentSession, user: latestUser }
          : currentSession;
        setSession(updatedSession);
        setUser(updatedSession.user);
        return updatedSession;
      }
      return null;
    } catch (err) {
      console.error('Error refreshing session:', err);
      return null;
    }
  }, []);

  const healBloatedSession = useCallback(async (currentUser: User) => {
    try {
      const avatar = currentUser.user_metadata?.avatar_url;
      // If avatar is a Base64 data URL or unexpectedly huge (> 500 chars), purge it from metadata
      if (typeof avatar === 'string' && (avatar.startsWith('data:image') || avatar.length > 500)) {
        console.warn('Detected bloated Base64 avatar_url in session. Auto-healing to prevent 494 REQUEST_HEADER_TOO_LARGE...');
        await supabase.auth.updateUser({
          data: { avatar_url: null },
        });
      }
    } catch (e) {
      console.error('Error in healBloatedSession:', e);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Fast initial check to populate session immediately on mount
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!isMounted) return;
      if (initialSession && !error) {
        setSession(initialSession);
        if (initialSession.user) {
          setUser(initialSession.user);
          healBloatedSession(initialSession.user);
          ensureProfile(initialSession.user);
        }
      }
      setLoading(false);
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    // Authoritative listener for auth state changes & token refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;

        const currentUser = newSession?.user ?? null;
        setSession(newSession);
        setUser(currentUser);
        setLoading(false);

        if (currentUser && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION')) {
          healBloatedSession(currentUser);
          ensureProfile(currentUser);
        }

        if (event === 'SIGNED_OUT') {
          profileCheckedRef.current = null;
          setUser(null);
          setSession(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [ensureProfile, healBloatedSession]);

  const signOut = async (redirectTo: string = '/gc') => {
    isSigningOutRef.current = true;
    setIsSigningOut(true);
    setUser(null);
    setSession(null);
    setLoading(false);
    profileCheckedRef.current = null;
    if (typeof document !== 'undefined') {
      document.cookie = 'user_plan=deleted; path=/; max-age=0; SameSite=Lax';
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const c = cookies[i].trim();
        const eqIdx = c.indexOf('=');
        const name = eqIdx > -1 ? c.substring(0, eqIdx).trim() : c;
        const isAuthSessionCookie =
          name === AUTH_COOKIE_NAME ||
          name.startsWith(`${AUTH_COOKIE_NAME}.`) ||
          name.includes('auth-token') ||
          name.includes('code-verifier');

        if (isAuthSessionCookie) {
          document.cookie = `${name}=deleted; path=/; max-age=0; SameSite=Lax`;
          document.cookie = `${name}=deleted; path=/; domain=${window.location.hostname}; max-age=0; SameSite=Lax`;
        }
      }
    }
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
    setUser(null);
    setSession(null);
    setLoading(false);
    if (typeof window !== 'undefined') {
      window.location.replace(redirectTo);
    } else {
      router.replace(redirectTo);
    }
  };

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [authModalError, setAuthModalError] = useState<string | null>(null);

  const openLoginModalHandler = useCallback(() => {
    setLoginModalOpen(true);
  }, []);

  const closeLoginModalHandler = useCallback(() => {
    setLoginModalOpen(false);
  }, []);

  useEffect(() => {
    const handleCustomOpen = () => setLoginModalOpen(true);
    const handleCustomClose = () => setLoginModalOpen(false);
    window.addEventListener('closeai-open-login', handleCustomOpen);
    window.addEventListener('closeai-close-login', handleCustomClose);
    return () => {
      window.removeEventListener('closeai-open-login', handleCustomOpen);
      window.removeEventListener('closeai-close-login', handleCustomClose);
    };
  }, []);

  // Auto-open login modal from URL query params (e.g. /?auth=login, /?auth=signup, or OAuth errors)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkUrlAuth = () => {
      const params = new URLSearchParams(window.location.search);
      const auth = params.get('auth');
      const error = params.get('error');
      const errorCode = params.get('error_code');
      const errorDesc = params.get('error_description');

      if (auth === 'login' || auth === 'signup' || error || errorCode || errorDesc) {
        setLoginModalOpen(true);
        if (error || errorCode || errorDesc) {
          let message = 'Unable to complete sign in. Please try again.';
          if (errorCode === 'bad_oauth_state' || errorDesc?.toLowerCase().includes('state')) {
            message = 'Your sign-in session expired or was interrupted. Please try signing in again.';
          } else if (errorCode === 'access_denied' || error === 'access_denied') {
            message = 'Sign-in was cancelled. Please try again when ready.';
          } else if (errorDesc) {
            message = decodeURIComponent(errorDesc.replace(/\+/g, ' '));
          }
          setAuthModalError(message);
        }
        // Clean address bar query param without triggering full reload or scroll
        const nextUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', nextUrl);
      }
    };

    checkUrlAuth();
    window.addEventListener('popstate', checkUrlAuth);
    return () => window.removeEventListener('popstate', checkUrlAuth);
  }, []);

  // Intercept all links targeting /?auth=login, /?auth=signup, or containing auth=login / auth=signup
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest?.('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      if (
        href === '/?auth=login' ||
        href === '/?auth=signup' ||
        href.includes('auth=login') ||
        href.includes('auth=signup')
      ) {
        e.preventDefault();
        e.stopPropagation();
        setLoginModalOpen(true);
      }
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, []);

  const value = {
    user,
    session,
    token: session?.access_token ?? null,
    loading,
    isSigningOut,
    signOut,
    refreshSession,
    openLoginModal: openLoginModalHandler,
    closeLoginModal: closeLoginModalHandler,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal
        open={loginModalOpen}
        onOpenChange={(isOpen) => {
          setLoginModalOpen(isOpen);
          if (!isOpen) setAuthModalError(null);
        }}
        initialError={authModalError}
      />
    </AuthContext.Provider>
  );
}
