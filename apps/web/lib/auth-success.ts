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
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next') ?? params.get('returnUrl');
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      destination = next;
    }
  }
  router.push(destination);
  router.refresh();
}
