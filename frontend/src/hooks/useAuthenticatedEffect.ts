import { useEffect, type DependencyList } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Run an effect only after auth has finished loading and the user is signed in.
 * Re-runs when the session is re-validated (tab focus) so dashboard data recovers
 * without a full page refresh.
 */
export function useAuthenticatedEffect(
  effect: () => void | (() => void),
  deps: DependencyList = [],
) {
  const { isAuthenticated, isLoading, sessionEpoch } = useAuth();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, sessionEpoch, ...deps]);
}
