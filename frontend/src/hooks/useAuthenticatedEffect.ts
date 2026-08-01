import { useEffect, useRef, type DependencyList } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Run an effect only after auth has finished loading and the user is signed in.
 * Re-runs when session is re-validated in the background (not on initial boot).
 */
export function useAuthenticatedEffect(
  effect: () => void | (() => void),
  deps: DependencyList = [],
) {
  const { isAuthenticated, isLoading, sessionEpoch } = useAuth();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    // Small defer so localStorage token is stable after auth state updates.
    const timer = window.setTimeout(() => {
      if (!mountedRef.current) return;
      if (!localStorage.getItem('token')) return;
      return effect();
    }, 0);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, sessionEpoch, ...deps]);
}
