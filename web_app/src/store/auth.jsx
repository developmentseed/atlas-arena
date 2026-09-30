'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  apiFetch,
  authConfigured,
  getToken,
  readSignInFragment,
  setToken,
  setUnauthorizedHandler,
  signInUrl,
} from '@/libs/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const signOut = useCallback(() => {
    // The API has no logout endpoint; the session token just expires.
    setToken(null);
    setUser(null);
    setStatus('signedOut');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
    if (!authConfigured) {
      setStatus('signedOut');
      return;
    }
    const outcome = readSignInFragment();
    if (outcome?.token) setToken(outcome.token);
    if (outcome?.error) setError(outcome.error);
    if (!getToken()) {
      setStatus('signedOut');
      return;
    }
    apiFetch('auth/me')
      .then(({ data }) => {
        setUser({ email: data.identity });
        setStatus('signedIn');
      })
      .catch(signOut);
  }, [signOut]);

  const signIn = useCallback(() => {
    window.location.href = signInUrl();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        error,
        clearError,
        signIn,
        signOut,
        enabled: authConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

// Renders children only for signed-in users. This is a UI convenience; the API
// is what actually rejects unauthenticated requests.
export const RequireAuth = ({ children, fallback = null }) => {
  const { status } = useAuth();
  return status === 'signedIn' ? children : fallback;
};
