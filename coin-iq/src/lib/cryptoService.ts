import axios from 'axios';
import { CryptoData } from '@/types/crypto';
import { COIN_IMAGES } from '@/lib/coinImages';

const BINANCE_BASE_URL = 'https://api.binance.com/api/v3';

// Map common crypto IDs to Binance trading pairs
const ID_TO_SYMBOL: Record<string, string> = {
  'bitcoin': 'BTCUSDT',
  'ethereum': 'ETHUSDT',
  'binancecoin': 'BNBUSDT',
  'ripple': 'XRPUSDT',
  'cardano': 'ADAUSDT',
  'solana': 'SOLUSDT',
  'dogecoin': 'DOGEUSDT',
  'polkadot': 'DOTUSDT',
  'matic-network': 'MATICUSDT',
  'litecoin': 'LTCUSDT',
  'chainlink': 'LINKUSDT',
  'stellar': 'XLMUSDT',
};

// Function to fetch cryptocurrency data from Binance
export const getCryptoData = async (limit: number = 10): Promise<CryptoData[]> => {
  try {
    // Call Binance directly — faster and no internal proxy timeout
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!response.ok) throw new Error('Binance API error');
    const all: any[] = await response.json();

    // Filter to known symbols and take top `limit` by quote volume
    const known = all
      .filter(t => t.symbol.endsWith('USDT'))
      .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, limit);

    return known.map((t: any) => {
      const sym = t.symbol.replace('USDT', '');
      return {
        id:                t.symbol.toLowerCase(),
        name:              sym,
        symbol:            sym.toLowerCase(),
        price:             parseFloat(t.lastPrice   || '0'),
        percentChange24h:  parseFloat(t.priceChangePercent || '0'),
        marketCap:         parseFloat(t.quoteVolume || '0'),
        volume24h:         parseFloat(t.quoteVolume || '0'),
        circulatingSupply: 0,
        totalSupply:       undefined,
        image:             COIN_IMAGES[sym] ?? '',
        marketCapRank:     undefined,
        maxSupply:         undefined,
        ath:               undefined,
        atl:               undefined,
        athChangePercentage: undefined,
      };
    });
  } catch (error: any) {
    console.error('Error fetching cryptocurrency data:', error);
    return [];
  }
};

// Function to get a single cryptocurrency by ID
export const getSingleCrypto = async (id: string): Promise<CryptoData | null> => {
  try {
    const symbol = ID_TO_SYMBOL[id] || `${id.replace('-', '').toUpperCase()}USDT`;
    const url = `${BINANCE_BASE_URL}/ticker/24hr?symbol=${symbol}`;
    
    const response = await axios.get<any>(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 10000,
      validateStatus: (status) => status < 500,
    });
    
    if (response.status >= 400) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const ticker = response.data;
    const price = parseFloat(ticker.lastPrice || '0');
    
    return {
      id: id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      symbol: id.substring(0, 3).toUpperCase(),
      price: price,
      percentChange24h: parseFloat(ticker.priceChangePercent || '0'),
      marketCap: price * parseFloat(ticker.volume || '0'),
      volume24h: parseFloat(ticker.quoteVolume || '0'),
      circulatingSupply: 0,
      totalSupply: undefined,
      image: COIN_IMAGES[id.substring(0, 3).toUpperCase()] ?? '',
      marketCapRank: undefined,
      maxSupply: undefined,
      ath: undefined,
      atl: undefined,
      athChangePercentage: undefined,
    };
  } catch (error: any) {
    console.error(`Error fetching cryptocurrency data for ${id} from Binance:`, error);
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.warn('Request timed out');
    } else if (error.code === 'ENOTFOUND') {
      console.warn('Network error: unable to reach Binance API server');
    } else if (error.request) {
      console.warn('Network error, no response received from server:', error.message);
    } else {
      console.warn('Request setup error:', error.message);
    }
    
    return null;
  }
};

// Function to get historical data for a cryptocurrency
export const getCryptoHistory = async (id: string, days: number = 7): Promise<any[]> => {
  try {
    const symbol = ID_TO_SYMBOL[id] || `${id.replace('-', '').toUpperCase()}USDT`;
    const interval = days <= 1 ? '1h' : days <= 7 ? '4h' : '1d';
    const url = `${BINANCE_BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${days * 6}`;
    
    const response = await axios.get<any>(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 10000,
      validateStatus: (status) => status < 500,
    });
    
    if (response.status >= 400) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    // Transform Binance kline data to [timestamp, price] format
    return response.data.map((kline: any) => [
      kline[0], // timestamp
      parseFloat(kline[4]) // closing price
    ]);
  } catch (error: any) {
    console.error(`Error fetching historical data for ${id} from Binance:`, error);
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.warn('Request timed out');
    } else if (error.code === 'ENOTFOUND') {
      console.warn('Network error: unable to reach Binance API server');
    } else if (error.request) {
      console.warn('Network error, no response received from server:', error.message);
    } else {
      console.warn('Request setup error:', error.message);
    }
    
    return [];
  }
};