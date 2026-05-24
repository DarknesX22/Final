// Service to interact with Binance API
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
  'tron': 'TRXUSDT',
  'avalanche-2': 'AVAXUSDT',
  'shiba-inu': 'SHIBUSDT',
  'dai': 'DAIUSDT',
  'uniswap': 'UNIUSDT',
  'wrapped-bitcoin': 'WBTCUSDT',
  'the-open-network': 'TONUSDT',
  'ethereum-classic': 'ETCUSDT',
};

// Map Binance symbols back to CoinGecko-style IDs
const SYMBOL_TO_ID: Record<string, string> = {
  'BTCUSDT': 'bitcoin',
  'ETHUSDT': 'ethereum',
  'BNBUSDT': 'binancecoin',
  'XRPUSDT': 'ripple',
  'ADAUSDT': 'cardano',
  'SOLUSDT': 'solana',
  'DOGEUSDT': 'dogecoin',
  'DOTUSDT': 'polkadot',
  'MATICUSDT': 'matic-network',
  'LTCUSDT': 'litecoin',
  'LINKUSDT': 'chainlink',
  'XLMUSDT': 'stellar',
  'TRXUSDT': 'tron',
  'AVAXUSDT': 'avalanche-2',
  'SHIBUSDT': 'shiba-inu',
  'DAIUSDT': 'dai',
  'UNIUSDT': 'uniswap',
  'WBTCUSDT': 'wrapped-bitcoin',
  'TONUSDT': 'the-open-network',
  'ETCUSDT': 'ethereum-classic',
};

// Image URLs for common cryptocurrencies
const CRYPTO_IMAGES: Record<string, string> = {
  'bitcoin': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579',
  'ethereum': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880',
  'binancecoin': 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png?1644979850',
  'ripple': 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png?1605778731',
  'cardano': 'https://assets.coingecko.com/coins/images/975/large/cardano.png?1547034860',
  'solana': 'https://assets.coingecko.com/coins/images/4128/large/Solana.jpg?1640133425',
  'dogecoin': 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png?1547792256',
  'polkadot': 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png?1639712644',
  'matic-network': 'https://assets.coingecko.com/coins/images/4713/large/polygon.png?1640133425',
  'litecoin': 'https://assets.coingecko.com/coins/images/2/large/litecoin.png?1547033579',
  'chainlink': 'https://assets.coingecko.com/coins/images/877/large/chainlink.png?1547033579',
  'stellar': 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png?1547033579',
  'tron': 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png?1547035628',
  'avalanche-2': 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png?1639712644',
  'shiba-inu': 'https://assets.coingecko.com/coins/images/11939/large/shiba.png?1639712644',
  'dai': 'https://assets.coingecko.com/coins/images/9956/large/Badge.png?1639712644',
  'uniswap': 'https://assets.coingecko.com/coins/images/12504/large/uni.jpg?1639712644',
  'wrapped-bitcoin': 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png?1547033579',
  'the-open-network': 'https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png?1639712644',
  'ethereum-classic': 'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png?1547033579',
};

// Fetches top cryptocurrencies with price, market cap, and 24h change
export async function getTopCryptos(limit: number = 10) {
  try {
    // Binance doesn't require API key for public market data
    const url = `${BINANCE_BASE_URL}/ticker/24hr`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        console.warn('Binance API rate limited, using mock data');
        return getMockTopCryptos(limit);
      } else {
        throw new Error(`Binance API error: ${response.status} - ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    
    // Filter only USDT pairs and transform to match expected format
    const usdtPairs = data
      .filter((ticker: any) => ticker.symbol.endsWith('USDT'))
      .slice(0, limit)
      .map((ticker: any) => {
        const id = SYMBOL_TO_ID[ticker.symbol] || ticker.symbol.replace('USDT', '').toLowerCase();
        const price = parseFloat(ticker.lastPrice);
        const priceChange = parseFloat(ticker.priceChange);
        const priceChangePercent = parseFloat(ticker.priceChangePercent);
        
        // Get image URL - use CoinGecko images for known coins, placeholder for others
        let imageUrl = CRYPTO_IMAGES[id];
        if (!imageUrl) {
          // Try to get from common symbol mappings
          const symbolUpper = ticker.symbol.replace('USDT', '');
          imageUrl = `https://placehold.co/32x32/000000/FFFFFF?text=${symbolUpper.substring(0, 2)}`;
        }
        
        return {
          id: id,
          symbol: ticker.symbol.replace('USDT', '').toLowerCase(),
          name: id.charAt(0).toUpperCase() + id.slice(1),
          image: imageUrl,
          current_price: price,
          market_cap: price * parseFloat(ticker.volume || '0'), // Approximate market cap
          market_cap_rank: 0, // Binance doesn't provide rank
          fully_diluted_valuation: null,
          total_volume: parseFloat(ticker.quoteVolume || '0'),
          high_24h: parseFloat(ticker.highPrice || '0'),
          low_24h: parseFloat(ticker.lowPrice || '0'),
          price_change_24h: priceChange,
          price_change_percentage_24h: priceChangePercent,
          price_change_percentage_7d: null,
          circulating_supply: null,
          total_supply: null,
          max_supply: null,
          ath: null,
          ath_change_percentage: null,
          ath_date: null,
          atl: null,
          atl_change_percentage: null,
          atl_date: null,
          roi: null,
          last_updated: new Date().toISOString(),
        };
      });
    
    return usdtPairs;
  } catch (error: any) {
    console.error('Error fetching top cryptos from Binance:', error);
    
    if (error.name === 'AbortError') {
      console.error('Request timed out');
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('Network error - check connectivity');
    }
    
    return getMockTopCryptos(limit);
  }
}

// Fallback mock data generator
function getMockTopCryptos(limit: number = 10) {
  const mockData = [
    {
      id: 'bitcoin',
      symbol: 'btc',
      name: 'Bitcoin',
      image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579',
      current_price: 43256.78,
      market_cap: 847392847392,
      market_cap_rank: 1,
      fully_diluted_valuation: 908765432109,
      total_volume: 23456789012,
      high_24h: 44123.45,
      low_24h: 42189.12,
      price_change_24h: 1234.56,
      price_change_percentage_24h: 2.93,
      price_change_percentage_7d: 5.21,
      circulating_supply: 19654321,
      total_supply: 21000000,
      max_supply: 21000000,
      ath: 68789.63,
      ath_change_percentage: -37.12,
      ath_date: '2021-11-10T14:24:11.849Z',
      atl: 67.81,
      atl_change_percentage: 63752.08,
      atl_date: '2013-07-06T00:00:00.000Z',
      roi: null,
      last_updated: new Date().toISOString(),
    },
    {
      id: 'ethereum',
      symbol: 'eth',
      name: 'Ethereum',
      image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880',
      current_price: 2356.21,
      market_cap: 283746592012,
      market_cap_rank: 2,
      fully_diluted_valuation: 283746592012,
      total_volume: 15678901234,
      high_24h: 2410.78,
      low_24h: 2298.34,
      price_change_24h: -54.57,
      price_change_percentage_24h: -2.26,
      price_change_percentage_7d: 1.87,
      circulating_supply: 120456789,
      total_supply: 120456789,
      max_supply: null,
      ath: 4878.26,
      ath_change_percentage: -51.72,
      ath_date: '2021-11-10T14:24:11.849Z',
      atl: 0.432979,
      atl_change_percentage: 544175.58,
      atl_date: '2015-10-20T00:00:00.000Z',
      roi: {
        times: 4712.42,
        currency: 'btc',
        percentage: 471242.4,
      },
      last_updated: new Date().toISOString(),
    },
    {
      id: 'solana',
      symbol: 'sol',
      name: 'Solana',
      image: 'https://assets.coingecko.com/coins/images/4128/large/Solana.jpg?1640133425',
      current_price: 98.45,
      market_cap: 42873645123,
      market_cap_rank: 5,
      fully_diluted_valuation: 52187654321,
      total_volume: 2345678901,
      high_24h: 102.34,
      low_24h: 95.23,
      price_change_24h: 3.22,
      price_change_percentage_24h: 3.38,
      price_change_percentage_7d: -1.24,
      circulating_supply: 435456789,
      total_supply: 528765432,
      max_supply: 999999999,
      ath: 259.96,
      ath_change_percentage: -62.13,
      ath_date: '2021-11-06T15:49:06.530Z',
      atl: 0.500821,
      atl_change_percentage: 19557.21,
      atl_date: '2020-05-11T00:21:22.166Z',
      roi: null,
      last_updated: new Date().toISOString(),
    },
    {
      id: 'cardano',
      symbol: 'ada',
      name: 'Cardano',
      image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png?1547034860',
      current_price: 0.4567,
      market_cap: 16087654321,
      market_cap_rank: 8,
      fully_diluted_valuation: 15528765432,
      total_volume: 456789012,
      high_24h: 0.4723,
      low_24h: 0.4412,
      price_change_24h: -0.0156,
      price_change_percentage_24h: -3.31,
      price_change_percentage_7d: 2.15,
      circulating_supply: 35223456789,
      total_supply: 45000000000,
      max_supply: 45000000000,
      ath: 3.09,
      ath_change_percentage: -85.21,
      ath_date: '2021-09-02T06:00:57.666Z',
      atl: 0.018974,
      atl_change_percentage: 2306.92,
      atl_date: '2020-03-13T02:22:55.090Z',
      roi: null,
      last_updated: new Date().toISOString(),
    },
    {
      id: 'dogecoin',
      symbol: 'doge',
      name: 'Dogecoin',
      image: 'https://assets.coingecko.com/coins/images/1/large/dogecoin.png?1547792256',
      current_price: 0.0823,
      market_cap: 11456789012,
      market_cap_rank: 10,
      fully_diluted_valuation: 11456789012,
      total_volume: 345678901,
      high_24h: 0.0856,
      low_24h: 0.0798,
      price_change_24h: 0.0025,
      price_change_percentage_24h: 3.14,
      price_change_percentage_7d: -0.87,
      circulating_supply: 139123456789,
      total_supply: 139123456789,
      max_supply: null,
      ath: 0.7316,
      ath_change_percentage: -88.71,
      ath_date: '2021-05-08T05:08:08.972Z',
      atl: 0.0000869,
      atl_change_percentage: 94722.83,
      atl_date: '2015-05-06T00:00:00.000Z',
      roi: null,
      last_updated: new Date().toISOString(),
    },
  ];
  
  // Return up to the requested limit
  return mockData.slice(0, limit);
}

// Fetches detailed information for a specific cryptocurrency
export async function getCryptoDetails(id?: string) {
  // Validate id parameter
  if (!id) {
    throw new Error('Crypto ID is required');
  }
  
  try {
    const symbol = ID_TO_SYMBOL[id] || `${id.replace('-', '').toUpperCase()}USDT`;
    const url = `${BINANCE_BASE_URL}/ticker/24hr?symbol=${symbol}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        console.warn('Binance API rate limited, using mock data');
        return getMockCryptoDetails(id);
      } else {
        throw new Error(`Binance API error: ${response.status} - ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    const price = parseFloat(data.lastPrice || '0');
    const priceChangePercent = parseFloat(data.priceChangePercent || '0');
    
    return {
      id: id,
      symbol: id.substring(0, 3).toLowerCase(),
      name: id.charAt(0).toUpperCase() + id.slice(1),
      image: {
        thumb: CRYPTO_IMAGES[id] || `https://placehold.co/32x32?text=${id.substring(0, 2).toUpperCase()}`,
        small: CRYPTO_IMAGES[id] || `https://placehold.co/64x64?text=${id.substring(0, 2).toUpperCase()}`,
        large: CRYPTO_IMAGES[id] || `https://placehold.co/128x128?text=${id.substring(0, 2).toUpperCase()}`,
      },
      market_data: {
        current_price: { usd: price },
        market_cap: { usd: price * parseFloat(data.volume || '0') },
        market_cap_rank: 0,
        total_volume: { usd: parseFloat(data.quoteVolume || '0') },
        high_24h: { usd: parseFloat(data.highPrice || '0') },
        low_24h: { usd: parseFloat(data.lowPrice || '0') },
        price_change_24h: parseFloat(data.priceChange || '0'),
        price_change_percentage_24h: priceChangePercent,
        price_change_percentage_7d: null,
        circulating_supply: null,
        total_supply: null,
        max_supply: null,
        last_updated: new Date().toISOString(),
      },
    };
  } catch (error: any) {
    console.error(`Error fetching details for ${id} from Binance:`, error);
    
    if (error.name === 'AbortError') {
      console.error('Request timed out');
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('Network error - check connectivity');
    }
    
    return getMockCryptoDetails(id);
  }
}

// Fallback mock data generator for crypto details
function getMockCryptoDetails(id?: string) {
  const mockData: Record<string, any> = {
    bitcoin: {
      id: 'bitcoin',
      symbol: 'btc',
      name: 'Bitcoin',
      image: {
        thumb: 'https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png?1547033579',
        small: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png?1547033579',
        large: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579',
      },
      market_data: {
        current_price: { usd: 43256.78 },
        market_cap: { usd: 847392847392 },
        market_cap_rank: 1,
        total_volume: { usd: 23456789012 },
        high_24h: { usd: 44123.45 },
        low_24h: { usd: 42189.12 },
        price_change_24h: 1234.56,
        price_change_percentage_24h: 2.93,
        price_change_percentage_7d: 5.21,
        circulating_supply: 19654321,
        total_supply: 21000000,
        max_supply: 21000000,
        last_updated: new Date().toISOString(),
      },
    },
    ethereum: {
      id: 'ethereum',
      symbol: 'eth',
      name: 'Ethereum',
      image: {
        thumb: 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png?1595348880',
        small: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880',
        large: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880',
      },
      market_data: {
        current_price: { usd: 2356.21 },
        market_cap: { usd: 283746592012 },
        market_cap_rank: 2,
        total_volume: { usd: 15678901234 },
        high_24h: { usd: 2410.78 },
        low_24h: { usd: 2298.34 },
        price_change_24h: -54.57,
        price_change_percentage_24h: -2.26,
        price_change_percentage_7d: 1.87,
        circulating_supply: 120456789,
        total_supply: 120456789,
        max_supply: null,
        last_updated: new Date().toISOString(),
      },
    },
    solana: {
      id: 'solana',
      symbol: 'sol',
      name: 'Solana',
      image: {
        thumb: 'https://assets.coingecko.com/coins/images/4128/thumb/Solana.jpg?1640133425',
        small: 'https://assets.coingecko.com/coins/images/4128/small/Solana.jpg?1640133425',
        large: 'https://assets.coingecko.com/coins/images/4128/large/Solana.jpg?1640133425',
      },
      market_data: {
        current_price: { usd: 98.45 },
        market_cap: { usd: 42873645123 },
        market_cap_rank: 5,
        total_volume: { usd: 2345678901 },
        high_24h: { usd: 102.34 },
        low_24h: { usd: 95.23 },
        price_change_24h: 3.22,
        price_change_percentage_24h: 3.38,
        price_change_percentage_7d: -1.24,
        circulating_supply: 435456789,
        total_supply: 528765432,
        max_supply: 999999999,
        last_updated: new Date().toISOString(),
      },
    },
  };
  
  // Check if id is defined and not null
  if (!id) {
    id = 'bitcoin'; // default to bitcoin if id is undefined
  }
  
  return mockData[id] || {
    id,
    symbol: id.substring(0, 3),
    name: id.charAt(0).toUpperCase() + id.slice(1),
    image: {
      thumb: `https://ui-avatars.com/api/?name=${id}&background=000000&color=fff`,
      small: `https://ui-avatars.com/api/?name=${id}&background=000000&color=fff`,
      large: `https://ui-avatars.com/api/?name=${id}&background=000000&color=fff`,
    },
    market_data: {
      current_price: { usd: Math.random() * 10000 },
      market_cap: { usd: Math.random() * 10000000000 },
      market_cap_rank: Math.floor(Math.random() * 100) + 1,
      total_volume: { usd: Math.random() * 1000000000 },
      price_change_percentage_24h: (Math.random() - 0.5) * 20,
      last_updated: new Date().toISOString(),
    },
  };
}

// Fetches historical data for a cryptocurrency (last 7 days)
export async function getCryptoHistory(id: string, days: number = 7) {
  try {
    const symbol = ID_TO_SYMBOL[id] || `${id.replace('-', '').toUpperCase()}USDT`;
    const interval = days <= 1 ? '1h' : days <= 7 ? '4h' : '1d';
    const url = `${BINANCE_BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${days * 6}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        console.warn('Binance API rate limited, using mock data');
        return getMockCryptoHistory(id, days);
      } else {
        throw new Error(`Binance API error: ${response.status} - ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    
    // Transform Binance kline data to match CoinGecko format
    const prices = data.map((kline: any) => [
      kline[0], // timestamp
      parseFloat(kline[4]) // closing price
    ]);
    
    const marketCaps = prices.map(([timestamp, price]: [number, number]) => [
      timestamp,
      price * 1000000 // Approximate market cap
    ]);
    
    const totalVolumes = prices.map(([timestamp, price]: [number, number]) => [
      timestamp,
      parseFloat(data[prices.indexOf([timestamp, price])]?.[7] || '0') // volume
    ]);
    
    return {
      prices,
      market_caps: marketCaps,
      total_volumes: totalVolumes
    };
  } catch (error: any) {
    console.error(`Error fetching history for ${id} from Binance:`, error);
    
    if (error.name === 'AbortError') {
      console.error('Request timed out');
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('Network error - check connectivity');
    }
    
    return getMockCryptoHistory(id, days);
  }
}

// Fallback mock data generator for crypto history
function getMockCryptoHistory(id: string, days: number = 7) {
  const historyData = [];
  const now = Date.now();
  
  for (let i = days; i >= 0; i--) {
    const timestamp = now - i * 24 * 60 * 60 * 1000;
    const basePrice = 1000 + Math.random() * 5000; // Random base price
    const fluctuation = (Math.random() - 0.5) * 0.1; // -5% to +5% fluctuation
    const price = basePrice * (1 + fluctuation);
    
    // Add two values per day (timestamp and price) as expected by CoinGecko API
    historyData.push([timestamp, price]);
  }
  
  return {
    prices: historyData,
    market_caps: historyData.map(([timestamp, price]) => [timestamp, price * 1000000]), // Mock market caps
    total_volumes: historyData.map(([timestamp, price]) => [timestamp, price * 100000]) // Mock volumes
  };
}

// Fetches supported coins list
export async function getSupportedCoins() {
  try {
    const url = `${BINANCE_BASE_URL}/exchangeInfo`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      if (response.status === 429) {
        console.warn('Binance API rate limited, using mock data');
        return getMockSupportedCoins();
      } else {
        throw new Error(`Binance API error: ${response.status} - ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    
    // Filter and transform to match expected format
    const symbols = data.symbols
      .filter((sym: any) => sym.quoteAsset === 'USDT' && sym.status === 'TRADING')
      .map((sym: any) => ({
        id: SYMBOL_TO_ID[sym.symbol] || sym.baseAsset.toLowerCase(),
        symbol: sym.baseAsset.toLowerCase(),
        name: sym.baseAsset,
      }));
    
    return symbols;
  } catch (error: any) {
    console.error('Error fetching supported coins from Binance:', error);
    
    if (error.name === 'AbortError') {
      console.error('Request timed out');
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('Network error - check connectivity');
    }
    
    return getMockSupportedCoins();
  }
}

// Fallback mock data generator for supported coins
function getMockSupportedCoins() {
  return [
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'eth', name: 'Ethereum' },
    { id: 'solana', symbol: 'sol', name: 'Solana' },
    { id: 'cardano', symbol: 'ada', name: 'Cardano' },
    { id: 'ripple', symbol: 'xrp', name: 'XRP' },
    { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin' },
    { id: 'matic-network', symbol: 'matic', name: 'Polygon' },
    { id: 'litecoin', symbol: 'ltc', name: 'Litecoin' },
    { id: 'chainlink', symbol: 'link', name: 'Chainlink' },
    { id: 'stellar', symbol: 'xlm', name: 'Stellar' },
  ];
}