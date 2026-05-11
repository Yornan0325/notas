import { useCallback, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

const themeStorageKey = 'notas-theme';
const themeChangeEvent = 'notas-theme-change';

const getStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  return localStorage.getItem(themeStorageKey) === 'dark' ? 'dark' : 'light';
};

const applyTheme = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

const persistTheme = (theme: ThemeMode) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(themeStorageKey, theme);
  window.dispatchEvent(new CustomEvent(themeChangeEvent, { detail: theme }));
};

export const initializeTheme = () => {
  if (typeof document === 'undefined') return;
  applyTheme(getStoredTheme());
};

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<ThemeMode>).detail || getStoredTheme();
      setTheme(nextTheme);
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === themeStorageKey) setTheme(getStoredTheme());
    };

    window.addEventListener(themeChangeEvent, handleThemeChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(themeChangeEvent, handleThemeChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((value) => (value === 'dark' ? 'light' : 'dark'));
  }, []);

  return {
    isDarkMode: theme === 'dark',
    theme,
    setTheme,
    toggleTheme,
  };
};
