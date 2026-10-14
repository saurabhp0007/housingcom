import { useAppSelector } from '@/shared/store/hooks';

export function useSession() {
  const session = useAppSelector((s) => s.session);
  return {
    ...session,
    isAuthenticated: session.status === 'authenticated',
    isLister: !!session.user?.lister,
  };
}
