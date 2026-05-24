import { useState, useEffect } from 'react';
import { CryptoData } from '@/types/crypto';

interface CryptoDetails {
  id: string;
  name: string;
  symbol: string;
  image: {
    large: string;
  };
  market_data: {
    current_price: { [key: string]: number };
    market_cap: { [key: string]: number };
    total_volume: { [key: string]: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    market_cap_rank: number;
  };
}

interface HistoryData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export const useTopCryptos = (limit: number = 10) => {
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCryptos = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/crypto?limit=${limit}`);
        if (!response.ok) {
          throw new Error('Failed to fetch cryptocurrency data');
        }
        const data = await response.json();
        // Convert API response to CryptoData format
        const convertedData = data.map((item: any) => {
          // Handle both string and object image formats
          const imageUrl = typeof item.image === 'string' 
            ? item.image 
            : item.image?.large || item.image?.small || item.image?.thumb;
          
          return {
            id: item.id,
            name: item.name,
            symbol: item.symbol,
            price: item.current_price || item.price || 0,
            percentChange24h: item.price_change_percentage_24h || item.percentChange24h || 0,
            percentChange7d: item.price_change_percentage_7d,
            marketCap: item.market_cap || item.marketCap || 0,
            volume24h: item.total_volume || item.volume24h || 0,
            circulatingSupply: item.circulating_supply || item.circulatingSupply || 0,
            totalSupply: item.total_supply || item.totalSupply,
            image: imageUrl || `https://placehold.co/32x32?text=${item.symbol?.substring(0, 2).toUpperCase() || 'CR'}`,
            marketCapRank: item.market_cap_rank || item.marketCapRank,
            maxSupply: item.max_supply || item.maxSupply,
            ath: item.ath,
            atl: item.atl,
            athChangePercentage: item.ath_change_percentage,
            description: item.description?.en
          };
        });
        setCryptos(convertedData || []);
        setError(null);
      } catch (err: any) {
        setError('Failed to fetch cryptocurrency data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCryptos();

    // Refresh data every 5 minutes
    const interval = setInterval(fetchCryptos, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [limit]);

  return { cryptos, loading, error };
};

export const useCryptoDetails = (id: string) => {
  const [crypto, setCrypto] = useState<CryptoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchCrypto = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/crypto/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Cryptocurrency not found');
          }
          throw new Error('Failed to fetch cryptocurrency details');
        }
        const data = await response.json();
        setCrypto(data);
        setError(null);
      } catch (err: any) {
        setError('Failed to fetch cryptocurrency details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCrypto();
  }, [id]);

  return { crypto, loading, error };
};

export const useCryptoHistory = (id: string, days: number = 7) => {
  const [history, setHistory] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/crypto/history/${id}?days=${days}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Cryptocurrency history not found');
          }
          throw new Error('Failed to fetch cryptocurrency history');
        }
        const data = await response.json();
        setHistory(data);
        setError(null);
      } catch (err: any) {
        setError('Failed to fetch cryptocurrency history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [id, days]);

  return { history, loading, error };
};