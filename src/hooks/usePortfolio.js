import { useEffect, useState, useCallback } from 'react';
import { getData, syncPortfolioPrices } from '../api/sheets';

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [dividends, setDividends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceSyncing, setPriceSyncing] = useState(false);
  const [lastPriceSync, setLastPriceSync] = useState(null);

  const loadData = useCallback(async () => {
    const data = await getData();
    setPortfolio(Array.isArray(data.portfolio) ? data.portfolio : []);
    setSummary(data.summary && !Array.isArray(data.summary) ? data.summary : null);
    setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
    setDividends(Array.isArray(data.dividends) ? data.dividends : []);
  }, []);

  const syncPrices = useCallback(async () => {
    setPriceSyncing(true);
    try {
      const result = await syncPortfolioPrices();
      setLastPriceSync({
        at: Date.now(),
        updated: Number(result?.updated || 0),
        yahoo: Number(result?.yahoo || 0),
        stooq: Number(result?.stooq || 0),
        missing: Number(result?.missing || 0)
      });
      return result;
    } finally {
      setPriceSyncing(false);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      try {
        await syncPrices();
      } catch (e) {
        // Fallback to existing saved prices if market quote API is unavailable.
        console.warn('Price sync failed:', e?.message || e);
      }
      await loadData();
    } catch (e) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [loadData, syncPrices]);

  const refreshPricesNow = useCallback(async () => {
    setError(null);
    try {
      const syncResult = await syncPrices();
      await loadData();
      return syncResult;
    } catch (e) {
      setError(e.message || 'Failed to sync prices');
      throw e;
    }
  }, [loadData, syncPrices]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    portfolio,
    summary,
    transactions,
    dividends,
    loading,
    error,
    priceSyncing,
    lastPriceSync,
    refresh: fetchAll,
    refreshPricesNow
  };
}

