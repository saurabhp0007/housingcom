import { useAppSelector } from '@/shared/store/hooks';
import type { SearchCenter } from '../search.slice';

/** Where results are centred: the searched place, else the user's home location. */
export function useSearchCenter(): SearchCenter | null {
  const center = useAppSelector((s) => s.search.center);
  const home = useAppSelector((s) => s.location.selected);
  if (center) return center;
  return home ? { label: home.label, subtitle: null, coords: home.coords } : null;
}
