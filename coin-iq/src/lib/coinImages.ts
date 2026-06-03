/**
 * Single source of truth for crypto coin images.
 * Used by all components across the app — ticker, coins page,
 * markets page, dashboard, predictions dashboard, and hooks.
 *
 * Keyed by uppercase symbol (e.g. "BTC", "ETH").
 * All images sourced from CoinGecko's public CDN.
 */
export const COIN_IMAGES: Record<string, string> = {
  BTC:   'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  ETH:   'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  BNB:   'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  XRP:   'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  ADA:   'https://assets.coingecko.com/coins/images/975/large/cardano.png',
  DOGE:  'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
  LTC:   'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
  BCH:   'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png',
  ETC:   'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png',
  TRX:   'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
  XLM:   'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png',
  XMR:   'https://assets.coingecko.com/coins/images/69/large/monero_logo.png',
  NEO:   'https://assets.coingecko.com/coins/images/480/large/NEO_512_512.png',
  EOS:   'https://assets.coingecko.com/coins/images/738/large/eos-eos-logo.png',
  DASH:  'https://assets.coingecko.com/coins/images/19/large/dash-logo.png',
  ZEC:   'https://assets.coingecko.com/coins/images/486/large/circle-zcash-color.png',
  IOTA:  'https://assets.coingecko.com/coins/images/692/large/IOTA_Swirl.png',
  QTUM:  'https://assets.coingecko.com/coins/images/684/large/qtum.png',
  OMG:   'https://assets.coingecko.com/coins/images/776/large/OMG_Network.jpg',
  ZRX:   'https://assets.coingecko.com/coins/images/863/large/0x.png',
  SOL:   'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  DOT:   'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
  MATIC: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
  LINK:  'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
  UNI:   'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
  AVAX:  'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
  ATOM:  'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png',
  SHIB:  'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
  TON:   'https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png',
  SUI:   'https://assets.coingecko.com/coins/images/26375/large/sui-ocean-square.png',
  PEPE:  'https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg',
  USDT:  'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  USDC:  'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
  BUSD:  'https://assets.coingecko.com/coins/images/9576/large/BUSD.png',
  DAI:   'https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png',
  WBTC:  'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png',
  AAVE:  'https://assets.coingecko.com/coins/images/12645/large/AAVE.png',
  CRO:   'https://assets.coingecko.com/coins/images/7310/large/cro_token_logo.png',
  VET:   'https://assets.coingecko.com/coins/images/1167/large/VeChain-Logo-768x725.png',
  FTM:   'https://assets.coingecko.com/coins/images/4001/large/Fantom_round.png',
  ALGO:  'https://assets.coingecko.com/coins/images/4380/large/download.png',
  NEAR:  'https://assets.coingecko.com/coins/images/10365/large/near.jpg',
  ICP:   'https://assets.coingecko.com/coins/images/14495/large/Internet_Computer_logo.png',
  FIL:   'https://assets.coingecko.com/coins/images/12817/large/filecoin.png',
  SAND:  'https://assets.coingecko.com/coins/images/12129/large/sandbox_logo.jpg',
  MANA:  'https://assets.coingecko.com/coins/images/878/large/decentraland-mana.png',
  AXS:   'https://assets.coingecko.com/coins/images/13029/large/axie_infinity_logo.png',
  GRT:   'https://assets.coingecko.com/coins/images/13397/large/Graph_Token.png',
  ENJ:   'https://assets.coingecko.com/coins/images/1102/large/enjin-coin-logo.png',
};

/**
 * Get coin image URL by symbol. Strips 'USDT' suffix if present.
 * Returns undefined if the symbol is not in the map (caller can decide fallback).
 */
export function getCoinImage(symbol: string): string | undefined {
  const sym = symbol.replace(/USDT$/i, '').toUpperCase();
  return COIN_IMAGES[sym];
}

/**
 * Get coin image URL with a text-initials fallback.
 * Never returns undefined — always gives a displayable URL.
 */
export function getCoinImageSafe(symbol: string): string {
  const sym = symbol.replace(/USDT$/i, '').toUpperCase();
  return COIN_IMAGES[sym] ?? '';
}
