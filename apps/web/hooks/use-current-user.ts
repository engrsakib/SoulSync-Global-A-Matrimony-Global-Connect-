'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { fetchCurrentUser, type PublicUser } from '@/lib/auth-api';
import { AUTH_SESSION_CHANGED } from '@/lib/auth-session';

export function useCurrentUser() {
  const pathname = usePathname();
  const [user, setUser] = React.useState<PublicUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const current = await fetchCurrentUser();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  React.useEffect(() => {
    const onAuthChanged = () => {
      refresh();
    };
    window.addEventListener(AUTH_SESSION_CHANGED, onAuthChanged);
    return () => window.removeEventListener(AUTH_SESSION_CHANGED, onAuthChanged);
  }, [refresh]);

  return { user, loading, refresh };
}
