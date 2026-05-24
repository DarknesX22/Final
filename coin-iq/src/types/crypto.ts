export interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  price: number;
  percentChange24h: number;
  percentChange7d?: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply?: number;
  image?: string;
  marketCapRank?: number;
  maxSupply?: number;
  ath?: number;
  atl?: number;
  athChangePercentage?: number;
  description?: string;
}

export interface PredictionData {
  symbol: string;
  predictedPrice: number;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  direction: 'up' | 'down';
  timeframe: string;
  historicalAccuracy?: number;
}

export interface MarketMetrics {
  totalMarketCap: string;
  totalVolume24h: string;
  btcDominance: string;
  ethDominance?: string;
  defiVolume?: string;
  liquidations?: number;
}