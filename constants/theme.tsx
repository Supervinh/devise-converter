import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark';

export type Theme = {
  mode: ThemeMode;
  bg: string;
  surface: string;
  surfaceAlt: string;
  surfaceActive: string;
  border: string;
  borderSubtle: string;
  text: string;
  textMuted: string;
  textDim: string;
  primary: string;
  accent: string;
  placeholder: string;
  errorBg: string;
  errorBorder: string;
  errorText: string;
  statusBar: 'light-content' | 'dark-content';
};

const darkTheme: Theme = {
  mode: 'dark',
  bg: '#0a0a0f',
  surface: '#16162a',
  surfaceAlt: '#1e1e35',
  surfaceActive: '#1a1a32',
  border: '#2a2a45',
  borderSubtle: '#1e1e35',
  text: '#e8e8f5',
  textMuted: '#9898b8',
  textDim: '#555570',
  primary: '#6c63ff',
  accent: '#222238',
  placeholder: '#2a2a45',
  errorBg: '#1f0f0f',
  errorBorder: '#3a1a1a',
  errorText: '#cc5555',
  statusBar: 'light-content',
};

const lightTheme: Theme = {
  mode: 'light',
  bg: '#f7f7fb',
  surface: '#ffffff',
  surfaceAlt: '#eef0f7',
  surfaceActive: '#eef0ff',
  border: '#e1e3ee',
  borderSubtle: '#eef0f7',
  text: '#16162a',
  textMuted: '#5a5a78',
  textDim: '#9898b8',
  primary: '#5b51e8',
  accent: '#eef0f7',
  placeholder: '#c4c7d6',
  errorBg: '#fdecec',
  errorBorder: '#f5c2c2',
  errorText: '#b73838',
  statusBar: 'dark-content',
};

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  toggle: () => void;
  setMode: (m: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'theme_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(system === 'light' ? 'light' : 'dark');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') setModeState(saved);
      } catch {
        // ignore
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    setModeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme: mode === 'dark' ? darkTheme : lightTheme, mode, toggle, setMode }),
    [mode, toggle, setMode]
  );

  if (!hydrated) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
