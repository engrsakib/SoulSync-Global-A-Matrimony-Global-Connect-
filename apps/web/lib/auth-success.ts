import { toast } from 'sonner';
import { notifyAuthSessionChanged } from '@/lib/auth-session';

type AuthRouter = {
  push: (href: string) => void;
  refresh: () => void;
};

export function completeAuthSuccess(router: AuthRouter, message = 'Welcome back!'): void {
  toast.success(message);
  notifyAuthSessionChanged();
  router.push('/');
  router.refresh();
}
