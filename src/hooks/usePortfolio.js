import { useEffect, useState, useCallback } from 'react';
import { getData, syncPortfolioPrices } from '../api/sheets';

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [dividends, setDividends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      try {
        await syncPortfolioPrices();
      } catch (e) {
        // Fallback to existing saved prices if market quote API is unavailable.
        console.warn('Price sync failed:', e?.message || e);
      }
      const data = await getData();
      setPortfolio(Array.isArray(data.portfolio) ? data.portfolio : []);
      setSummary(data.summary && !Array.isArray(data.summary) ? data.summary : null);
      setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      setDividends(Array.isArray(data.dividends) ? data.dividends : []);
    } catch (e) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

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
    refresh: fetchAll
  };
}

