import { useState, useCallback } from 'react';
import { NO_DECIMAL_CURRENCIES } from '../constants/currencies';

type RateState = {
  rate: number | null;
  loading: boolean;
  error: string | null;
  updatedAt: string | null;
};

export function useExchangeRate() {
  const [state, setState] = useState<RateState>({
    rate: null,
    loading: false,
    error: null,
    updatedAt: null,
  });

  const fetchRate = useCallback(async (from: string, to: string) => {
    if (from === to) {
      setState({ rate: 1, loading: false, error: null, updatedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const res = await fetch(`https://api.frankfurter.dev/v1/latest?from=${from}&to=${to}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rate = data.rates[to];
      if (!rate) throw new Error('Devise non disponible');

      setState({
        rate,
        loading: false,
        error: null,
        updatedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      });
    } catch (e: any) {
      console.error('[useExchangeRate] fetch error:', e);
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Erreur : ${e?.message ?? e}`,
      }));
    }
  }, []);

  const convert = useCallback(
    (amount: number, toCurrency: string): string => {
      if (state.rate === null || isNaN(amount)) return '—';
      const result = amount * state.rate;
      const decimals = NO_DECIMAL_CURRENCIES.includes(toCurrency) ? 0 : 2;
      return result.toLocaleString('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    },
    [state.rate]
  );

  return { ...state, fetchRate, convert };
}
