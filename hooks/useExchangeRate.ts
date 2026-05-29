import { useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NO_DECIMAL_CURRENCIES } from '../constants/currencies';

const CACHE_TTL = 3_600_000; // 1 hour in ms

type RateSource = 'network' | 'cache' | 'stale-cache';

type RateState = {
  rates: Record<string, number>;
  loading: boolean;
  error: string | null;
  updatedAt: string | null;
  source: RateSource | null;
};

type CacheEntry = {
  rate: number;
  timestamp: number;
};

function cacheKey(from: string, to: string) {
  return `rate_${from}_${to}`;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

async function readCache(from: string, to: string): Promise<CacheEntry | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(from, to));
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    await AsyncStorage.removeItem(cacheKey(from, to));
    return null;
  }
}

async function writeCache(from: string, to: string, rate: number, timestamp: number) {
  try {
    await AsyncStorage.setItem(cacheKey(from, to), JSON.stringify({ rate, timestamp }));
    await AsyncStorage.setItem(cacheKey(to, from), JSON.stringify({ rate: 1 / rate, timestamp }));
  } catch {
    // Cache write failure is non-fatal
  }
}

export function useExchangeRate() {
  const [state, setState] = useState<RateState>({
    rates: {},
    loading: false,
    error: null,
    updatedAt: null,
    source: null,
  });

  const currentKeyRef = useRef('');

  const fetchRates = useCallback(async (from: string, targets: string[], forceRefresh = false) => {
    const unique = [...new Set(targets.filter(t => t !== from))];
    if (unique.length === 0) return;

    const requestKey = `${from}:${[...unique].sort().join(',')}`;
    currentKeyRef.current = requestKey;

    // Check if all targets are fresh in cache
    if (!forceRefresh) {
      const cachedRates: Record<string, number> = {};
      let oldestTs = Infinity;
      let allFresh = true;

      for (const to of unique) {
        const entry = await readCache(from, to);
        if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
          cachedRates[to] = entry.rate;
          if (entry.timestamp < oldestTs) oldestTs = entry.timestamp;
        } else {
          allFresh = false;
          break;
        }
      }

      if (allFresh) {
        if (currentKeyRef.current !== requestKey) return;
        setState({
          rates: cachedRates,
          loading: false,
          error: null,
          updatedAt: formatTime(oldestTs),
          source: 'cache',
        });
        return;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const res = await fetch(
        `https://api.frankfurter.dev/v1/latest?from=${from}&to=${unique.join(',')}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (currentKeyRef.current !== requestKey) return;

      const now = Date.now();
      const fetchedRates: Record<string, number> = {};
      for (const to of unique) {
        const r = data.rates[to];
        if (r) {
          fetchedRates[to] = r;
          await writeCache(from, to, r, now);
        }
      }

      setState({ rates: fetchedRates, loading: false, error: null, updatedAt: formatTime(now), source: 'network' });
    } catch (e: any) {
      console.error('[useExchangeRate] fetch error:', e);
      if (currentKeyRef.current !== requestKey) return;

      // Fallback: use any available stale cache entries
      const staleRates: Record<string, number> = {};
      let oldestTs = Infinity;
      for (const to of unique) {
        const entry = await readCache(from, to);
        if (entry) {
          staleRates[to] = entry.rate;
          if (entry.timestamp < oldestTs) oldestTs = entry.timestamp;
        }
      }

      if (Object.keys(staleRates).length > 0) {
        setState({
          rates: staleRates,
          loading: false,
          error: null,
          updatedAt: formatTime(oldestTs === Infinity ? Date.now() : oldestTs),
          source: 'stale-cache',
        });
      } else {
        setState(prev => ({ ...prev, loading: false, error: `Erreur : ${e?.message ?? e}` }));
      }
    }
  }, []);

  const convert = useCallback(
    (amount: number, toCurrency: string): string => {
      const rate = state.rates[toCurrency];
      if (rate === undefined || isNaN(amount)) return '—';
      const result = amount * rate;
      const decimals = NO_DECIMAL_CURRENCIES.includes(toCurrency) ? 0 : 2;
      return result.toLocaleString('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    },
    [state.rates]
  );

  return { ...state, fetchRates, convert };
}
