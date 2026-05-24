import axios from 'axios';
import { CryptoData } from '@/types/crypto';

const BINANCE_API_KEY = process.env.BINANCE_API_KEY;
const BINANCE_API_SECRET = process.env.BINANCE_API_SECRET;
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


const COIN_IMAGES: Record<string, string> = {
  BTC:  'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  ETH:  'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  BNB:  'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  XRP:  'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  ADA:  'https://assets.coingecko.com/coins/images/975/large/cardano.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
  LTC:  'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
  BCH:  'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png',
  ETC:  'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png',
  TRX:  'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
  XLM:  'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png',
  XMR:  'https://assets.coingecko.com/coins/images/69/large/monero_logo.png',
  NEO:  'https://assets.coingecko.com/coins/images/480/large/NEO_512_512.png',
  EOS:  'https://assets.coingecko.com/coins/images/738/large/eos-eos-logo.png',
  DASH: 'https://assets.coingecko.com/coins/images/19/large/dash-logo.png',
  ZEC:  'https://assets.coingecko.com/coins/images/486/large/circle-zcash-color.png',
  IOTA: 'https://assets.coingecko.com/coins/images/692/large/IOTA_Swirl.png',
  QTUM: 'https://assets.coingecko.com/coins/images/684/large/qtum.png',
  OMG:  'https://assets.coingecko.com/coins/images/776/large/OMG_Network.jpg',
  ZRX:  'https://assets.coingecko.com/coins/images/863/large/0x.png',
  SOL:  'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  DOT:  'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
  MATIC:'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
  LINK: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
  UNI:  'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
  AVAX: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
  ATOM: 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png',
  SHIB: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
  TON:  'https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png',
  SUI:  'https://assets.coingecko.com/coins/images/26375/large/sui-ocean-square.png',
  PEPE: 'https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg',
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
        image:             COIN_IMAGES[sym] ?? `https://placehold.co/32x32/f97316/fff?text=${sym.slice(0,2)}`,
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
      image: `https://placehold.co/32x32?text=${id.substring(0, 2).toUpperCase()}`,
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