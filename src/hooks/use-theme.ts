import { useKV } from '@github/spark/hooks';
import { Theme } from '@/lib/types';

export function useTheme() {
  const [theme, setTheme] = useKV<Theme>('nexus-theme', 'cyberpunk');

  const applyTheme = (newTheme: Theme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
    setTheme(newTheme);
  };

  // Apply theme on load
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }

  return { theme, setTheme: applyTheme };
}