import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';

export function useThemeClasses<T>(getClasses: (theme: string) => T): T {
  const theme = useAppStore((s) => s.theme);
  return useMemo(() => getClasses(theme), [getClasses, theme]);
}