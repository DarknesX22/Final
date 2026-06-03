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

// PredictionData and MarketMetrics removed — never referenced in codebase