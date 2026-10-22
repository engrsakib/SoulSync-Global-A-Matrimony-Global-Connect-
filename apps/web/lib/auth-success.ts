import { toast } from 'sonner';
import { clearSessionExpiredRedirectFlag, notifyAuthSessionChanged } from '@/lib/auth-session';

type AuthRouter = {
  push: (href: string) => void;
  refresh: () => void;
};

export function completeAuthSuccess(router: AuthRouter, message = 'Welcome back!'): void {
  toast.success(message);
  clearSessionExpiredRedirectFlag();
  notifyAuthSessionChanged();
  let destination = '/';
  if (typeof window !== 'undefined') {
    const next = new URLSearchParams(window.location.search).get('next');
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      destination = next;
    }
  }
  router.push(destination);
  router.refresh();
}
