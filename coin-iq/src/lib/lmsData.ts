// ── LMS Course Content ────────────────────────────────────────────────────────
// All course content is stored here in code — no DB needed for content.
// Progress, quiz scores, and certificates are stored in the DB.

export interface Lesson {
  index: number;
  title: string;
  duration: number; // minutes
  content: string;  // markdown-style text
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number; // index of correct option
  explanation: string;
}

export interface Course {
  slug: string;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  durationMinutes: number;
  icon: string;
  color: string; // tailwind bg class
  lessons: Lesson[];
  quiz: QuizQuestion[];
}

export const COURSES: Course[] = [
  {
    slug: 'blockchain-basics',
    title: 'Blockchain Basics',
    description: 'Understand how blockchain technology works, from distributed ledgers to consensus mechanisms.',
    level: 'Beginner',
    durationMinutes: 25,
    icon: '⛓️',
    color: 'bg-blue-50 border-blue-200',
    lessons: [
      {
        index: 0,
        title: 'What is a Blockchain?',
        duration: 5,
        content: `## What is a Blockchain?

A **blockchain** is a distributed database or ledger shared among a network of computers. Unlike a traditional database managed by a central authority, a blockchain is maintained by thousands of nodes simultaneously.

### Key Properties

- **Decentralized** — No single entity controls the data
- **Immutable** — Once data is recorded, it cannot be altered
- **Transparent** — All transactions are publicly visible
- **Secure** — Cryptographic hashing protects data integrity

### How Blocks Work

Each block contains:
1. A set of transactions
2. A timestamp
3. A cryptographic hash of the previous block
4. Its own unique hash

This chain of hashes is what makes the blockchain tamper-evident. Changing any block would invalidate every block after it.`,
      },
      {
        index: 1,
        title: 'Consensus Mechanisms',
        duration: 6,
        content: `## Consensus Mechanisms

Since no central authority validates transactions, blockchains use **consensus mechanisms** — rules that all nodes agree to follow.

### Proof of Work (PoW)
Used by Bitcoin. Miners compete to solve complex mathematical puzzles. The winner adds the next block and earns a reward.

- ✅ Highly secure and battle-tested
- ❌ Energy intensive

### Proof of Stake (PoS)
Used by Ethereum (post-Merge). Validators are chosen based on how much cryptocurrency they "stake" as collateral.

- ✅ Energy efficient (99% less than PoW)
- ✅ Faster transaction finality
- ❌ Wealthier validators have more influence

### Other Mechanisms
- **Delegated PoS (DPoS)** — Token holders vote for delegates
- **Proof of Authority (PoA)** — Trusted validators, used in private chains`,
      },
      {
        index: 2,
        title: 'Wallets & Keys',
        duration: 5,
        content: `## Wallets & Cryptographic Keys

A crypto wallet doesn't store coins — it stores your **private keys**, which prove ownership of funds on the blockchain.

### Public vs Private Keys

| Key | Purpose | Share? |
|-----|---------|--------|
| Public Key | Your address — others send funds here | ✅ Yes |
| Private Key | Signs transactions — proves ownership | ❌ Never |

### Wallet Types

**Hot Wallets** (connected to internet)
- Software wallets (MetaMask, Trust Wallet)
- Exchange wallets (Coinbase, Binance)
- Convenient but more vulnerable

**Cold Wallets** (offline)
- Hardware wallets (Ledger, Trezor)
- Paper wallets
- Most secure for long-term storage

### Seed Phrases
A 12 or 24-word recovery phrase that can restore your wallet. **Never share it with anyone.**`,
      },
      {
        index: 3,
        title: 'Transactions & Fees',
        duration: 5,
        content: `## Transactions & Gas Fees

### How a Transaction Works
1. You sign a transaction with your private key
2. It's broadcast to the network
3. Nodes validate it
4. Miners/validators include it in a block
5. After enough confirmations, it's final

### Gas Fees (Ethereum)
Gas is the unit measuring computational effort. You pay:

**Gas Fee = Gas Used × Gas Price (in Gwei)**

- **Base fee** — Burned (removed from supply) since EIP-1559
- **Priority fee (tip)** — Goes to the validator
- Higher fees = faster inclusion in a block

### Bitcoin Fees
Simpler — based on transaction size in bytes and network congestion. No gas concept.

### Why Fees Exist
Fees prevent spam and compensate validators for securing the network.`,
      },
    ],
    quiz: [
      {
        id: 1,
        question: 'What makes a blockchain immutable?',
        options: [
          'A central authority approves all changes',
          'Each block contains the hash of the previous block',
          'Transactions are encrypted with AES-256',
          'Nodes vote on every change',
        ],
        correct: 1,
        explanation: 'Each block contains a cryptographic hash of the previous block. Changing any block would invalidate all subsequent blocks, making tampering evident.',
      },
      {
        id: 2,
        question: 'Which consensus mechanism does Bitcoin use?',
        options: ['Proof of Stake', 'Proof of Authority', 'Proof of Work', 'Delegated PoS'],
        correct: 2,
        explanation: 'Bitcoin uses Proof of Work, where miners compete to solve mathematical puzzles to add new blocks.',
      },
      {
        id: 3,
        question: 'What does a crypto wallet actually store?',
        options: ['Your cryptocurrency coins', 'Your private keys', 'A copy of the blockchain', 'Your transaction history'],
        correct: 1,
        explanation: 'A wallet stores private keys. The coins themselves exist on the blockchain — the wallet just proves your ownership.',
      },
      {
        id: 4,
        question: 'What is a "gas fee" in Ethereum?',
        options: [
          'A fee paid to the Ethereum Foundation',
          'The cost of electricity for mining',
          'Payment for computational work to process a transaction',
          'A tax on crypto profits',
        ],
        correct: 2,
        explanation: 'Gas fees compensate validators for the computational resources used to process and validate transactions on Ethereum.',
      },
      {
        id: 5,
        question: 'Which wallet type is most secure for long-term storage?',
        options: ['Exchange wallet', 'Mobile hot wallet', 'Hardware (cold) wallet', 'Browser extension wallet'],
        correct: 2,
        explanation: 'Hardware wallets store private keys offline, making them immune to online attacks and the safest option for long-term storage.',
      },
    ],
  },

  {
    slug: 'ethereum-defi',
    title: 'Ethereum & DeFi',
    description: 'Explore smart contracts, decentralized finance protocols, and how Ethereum powers the DeFi ecosystem.',
    level: 'Intermediate',
    durationMinutes: 30,
    icon: '⟠',
    color: 'bg-purple-50 border-purple-200',
    lessons: [
      {
        index: 0,
        title: 'Smart Contracts',
        duration: 6,
        content: `## Smart Contracts

A **smart contract** is self-executing code stored on the blockchain. When predefined conditions are met, it automatically executes — no intermediary needed.

### Key Properties
- **Trustless** — Code enforces the rules, not a third party
- **Transparent** — Anyone can read the contract code
- **Immutable** — Once deployed, cannot be changed (usually)
- **Deterministic** — Same input always produces same output

### Solidity Example
\`\`\`solidity
contract SimpleStorage {
    uint256 public value;
    
    function set(uint256 _value) public {
        value = _value;
    }
}
\`\`\`

### Use Cases
- Token creation (ERC-20, ERC-721)
- Decentralized exchanges
- Lending protocols
- DAOs (Decentralized Autonomous Organizations)`,
      },
      {
        index: 1,
        title: 'What is DeFi?',
        duration: 6,
        content: `## Decentralized Finance (DeFi)

DeFi recreates traditional financial services — lending, borrowing, trading — using smart contracts instead of banks.

### Core DeFi Primitives

**Decentralized Exchanges (DEXs)**
- Uniswap, Curve, SushiSwap
- Use Automated Market Makers (AMMs) instead of order books
- You trade directly from your wallet

**Lending & Borrowing**
- Aave, Compound, MakerDAO
- Deposit collateral → borrow against it
- Interest rates set algorithmically by supply/demand

**Yield Farming**
- Provide liquidity to earn trading fees + token rewards
- APYs can be very high but risks are significant

### TVL (Total Value Locked)
The standard metric for DeFi size — total assets deposited in protocols. At peak, DeFi TVL exceeded $180 billion.`,
      },
      {
        index: 2,
        title: 'Liquidity Pools & AMMs',
        duration: 6,
        content: `## Liquidity Pools & Automated Market Makers

### Traditional Order Books vs AMMs

Traditional exchanges match buyers and sellers. AMMs use a mathematical formula instead:

**Constant Product Formula: x × y = k**

Where x and y are the reserves of two tokens, and k is constant.

### How It Works
1. Liquidity providers (LPs) deposit equal value of two tokens
2. Traders swap against the pool
3. Price adjusts automatically based on the ratio
4. LPs earn a % of every trade as fees

### Impermanent Loss
When you provide liquidity, price changes can leave you with less value than simply holding. This is called **impermanent loss** — it's "impermanent" because it reverses if prices return to original levels.

### Concentrated Liquidity (Uniswap v3)
LPs can concentrate liquidity in specific price ranges, earning more fees but with higher impermanent loss risk.`,
      },
      {
        index: 3,
        title: 'DeFi Risks',
        duration: 6,
        content: `## DeFi Risks

DeFi offers high potential returns but comes with unique risks.

### Smart Contract Risk
Bugs in contract code can be exploited. Over $3 billion was lost to DeFi hacks in 2022 alone.

**Mitigation:** Use audited protocols, check audit reports on sites like CertiK or OpenZeppelin.

### Liquidation Risk
If your collateral value drops below the required ratio, your position gets liquidated automatically.

**Example:** Borrow $500 USDC against $1000 ETH. If ETH drops 60%, you get liquidated.

### Oracle Manipulation
DeFi protocols rely on price oracles. Flash loan attacks can manipulate oracle prices to drain funds.

### Rug Pulls
Malicious developers abandon a project and drain liquidity. Common in new, unaudited tokens.

### Regulatory Risk
DeFi operates in a legal grey area. Regulations could impact protocol accessibility.

**Golden Rule:** Never invest more than you can afford to lose entirely.`,
      },
    ],
    quiz: [
      {
        id: 1,
        question: 'What is a smart contract?',
        options: [
          'A legal agreement stored on a server',
          'Self-executing code stored on the blockchain',
          'A type of cryptocurrency wallet',
          'An agreement between two exchanges',
        ],
        correct: 1,
        explanation: 'Smart contracts are self-executing programs on the blockchain that automatically enforce rules when conditions are met.',
      },
      {
        id: 2,
        question: 'What formula do most AMMs use?',
        options: ['x + y = k', 'x × y = k', 'x / y = k', 'x² + y² = k'],
        correct: 1,
        explanation: 'The constant product formula x × y = k ensures the product of reserves stays constant, automatically adjusting prices.',
      },
      {
        id: 3,
        question: 'What is TVL in DeFi?',
        options: [
          'Total Volume Liquidated',
          'Token Velocity Limit',
          'Total Value Locked',
          'Transaction Validation Latency',
        ],
        correct: 2,
        explanation: 'TVL (Total Value Locked) measures the total assets deposited in DeFi protocols and is the standard metric for DeFi size.',
      },
      {
        id: 4,
        question: 'What is impermanent loss?',
        options: [
          'Losing funds to a hack',
          'Value loss from price changes when providing liquidity',
          'Gas fees exceeding trade value',
          'A smart contract bug',
        ],
        correct: 1,
        explanation: 'Impermanent loss occurs when the price ratio of tokens in a liquidity pool changes, leaving LPs with less value than simply holding.',
      },
      {
        id: 5,
        question: 'Which of these is NOT a DeFi risk?',
        options: ['Smart contract bugs', 'Liquidation', 'Proof of Work energy use', 'Oracle manipulation'],
        correct: 2,
        explanation: 'Proof of Work energy consumption is a blockchain consensus concern, not a DeFi-specific risk.',
      },
    ],
  },

  {
    slug: 'nfts-digital-assets',
    title: 'NFTs & Digital Assets',
    description: 'Learn what NFTs are, how they work technically, their use cases, and the risks involved.',
    level: 'Beginner',
    durationMinutes: 20,
    icon: '🖼️',
    color: 'bg-pink-50 border-pink-200',
    lessons: [
      {
        index: 0,
        title: 'What are NFTs?',
        duration: 5,
        content: `## Non-Fungible Tokens (NFTs)

An **NFT** is a unique digital token on the blockchain that proves ownership of a specific item.

### Fungible vs Non-Fungible

| | Fungible | Non-Fungible |
|--|---------|-------------|
| Example | Bitcoin, USD | CryptoPunk, Bored Ape |
| Interchangeable? | ✅ Yes | ❌ No |
| Unique? | ❌ No | ✅ Yes |

One Bitcoin equals any other Bitcoin. But NFT #1234 is unique and cannot be replaced.

### The ERC-721 Standard
Most NFTs use the ERC-721 token standard on Ethereum. Each token has a unique ID and an owner address stored on-chain.

### What Does "Owning" an NFT Mean?
You own the token on the blockchain. The actual file (image, video) is usually stored off-chain on IPFS or a server. Ownership of the NFT ≠ copyright of the artwork.`,
      },
      {
        index: 1,
        title: 'NFT Use Cases',
        duration: 5,
        content: `## NFT Use Cases

### Digital Art & Collectibles
The most well-known use case. Artists sell unique digital works directly to collectors.
- CryptoPunks, Bored Ape Yacht Club, Art Blocks

### Gaming
In-game items as NFTs — players truly own their assets and can trade them.
- Axie Infinity, Gods Unchained, Illuvium

### Music & Entertainment
Artists tokenize albums, concert tickets, or exclusive content.
- Kings of Leon released an album as an NFT
- NFT tickets prevent scalping and enable royalties

### Real World Assets (RWAs)
Tokenizing physical assets — real estate, luxury goods, certificates.

### Identity & Credentials
Soulbound tokens (non-transferable NFTs) for diplomas, certifications, and identity.

### Domain Names
ENS (Ethereum Name Service) domains are NFTs — e.g., "yourname.eth"`,
      },
      {
        index: 2,
        title: 'NFT Risks & Criticism',
        duration: 5,
        content: `## NFT Risks & Criticism

### Market Volatility
NFT prices are highly speculative. Many collections that sold for millions are now worth near zero.

### Wash Trading
Sellers trade NFTs between their own wallets to inflate apparent prices and volume.

### Environmental Concerns
Early NFTs on Proof of Work chains had high carbon footprints. Ethereum's move to PoS reduced this by ~99%.

### Intellectual Property Issues
Buying an NFT doesn't grant copyright. Artists have had their work minted as NFTs without permission.

### Scams & Phishing
- Fake minting sites
- Discord/Twitter impersonation
- Malicious smart contracts that drain wallets

### Storage Risk
If the company hosting the NFT's image shuts down, the image disappears. IPFS mitigates this but isn't perfect.

**Due Diligence Checklist:**
- ✅ Verify contract address on Etherscan
- ✅ Check team identity and roadmap
- ✅ Confirm image storage method
- ✅ Review smart contract audit`,
      },
    ],
    quiz: [
      {
        id: 1,
        question: 'What makes an NFT "non-fungible"?',
        options: [
          'It cannot be sold',
          'Each token is unique and not interchangeable',
          'It has no monetary value',
          'It is stored off-chain',
        ],
        correct: 1,
        explanation: 'Non-fungible means each token is unique. Unlike Bitcoin where one BTC equals another, each NFT has a unique ID and cannot be replaced.',
      },
      {
        id: 2,
        question: 'Which token standard do most NFTs use on Ethereum?',
        options: ['ERC-20', 'ERC-721', 'ERC-1155', 'BEP-20'],
        correct: 1,
        explanation: 'ERC-721 is the standard for non-fungible tokens on Ethereum, giving each token a unique ID.',
      },
      {
        id: 3,
        question: 'What is "wash trading" in NFTs?',
        options: [
          'Cleaning NFT metadata',
          'Trading between own wallets to inflate prices',
          'Converting NFTs to fungible tokens',
          'Burning NFTs to reduce supply',
        ],
        correct: 1,
        explanation: 'Wash trading involves selling an NFT between wallets you control to create fake volume and inflate perceived value.',
      },
      {
        id: 4,
        question: 'Does buying an NFT give you copyright of the artwork?',
        options: [
          'Yes, always',
          'Only if stated in the terms',
          'No, never',
          'Only for ERC-721 tokens',
        ],
        correct: 1,
        explanation: 'Buying an NFT gives you ownership of the token, not copyright. Copyright terms vary by project and must be explicitly granted.',
      },
      {
        id: 5,
        question: 'What is a Soulbound Token?',
        options: [
          'An NFT tied to a game character',
          'A non-transferable NFT for identity/credentials',
          'An NFT with built-in royalties',
          'A token that burns after use',
        ],
        correct: 1,
        explanation: 'Soulbound tokens are non-transferable NFTs proposed for use as digital identity, diplomas, and credentials.',
      },
    ],
  },

  {
    slug: 'crypto-trading',
    title: 'Crypto Trading & Analysis',
    description: 'Master technical analysis, trading strategies, risk management, and how to read market signals.',
    level: 'Advanced',
    durationMinutes: 35,
    icon: '📈',
    color: 'bg-green-50 border-green-200',
    lessons: [
      {
        index: 0,
        title: 'Technical Analysis Basics',
        duration: 7,
        content: `## Technical Analysis Basics

Technical analysis (TA) uses historical price and volume data to forecast future price movements.

### Core Assumption
Price reflects all available information. Patterns repeat because human psychology is consistent.

### Key Concepts

**Support & Resistance**
- Support: Price level where buying pressure historically stops a decline
- Resistance: Price level where selling pressure historically stops a rise

**Trend Lines**
Connect successive highs (downtrend) or lows (uptrend). A break of the trend line signals a potential reversal.

**Candlestick Charts**
Each candle shows Open, High, Low, Close for a time period.
- Green/White = price closed higher
- Red/Black = price closed lower

**Common Patterns**
- Head & Shoulders (reversal)
- Double Top/Bottom (reversal)
- Bull/Bear Flag (continuation)
- Cup & Handle (bullish continuation)`,
      },
      {
        index: 1,
        title: 'Key Indicators',
        duration: 7,
        content: `## Key Technical Indicators

### RSI (Relative Strength Index)
Measures momentum on a 0-100 scale.
- **>70** = Overbought (potential sell signal)
- **<30** = Oversold (potential buy signal)
- **Divergence** = Price makes new high but RSI doesn't → bearish signal

### MACD (Moving Average Convergence Divergence)
Shows relationship between two EMAs (12 and 26 period).
- **Signal line crossover** = Buy/sell signal
- **Histogram** = Momentum strength
- **Zero line cross** = Trend change

### Bollinger Bands
Three lines: middle SMA + upper/lower bands (2 standard deviations).
- Price touching upper band = overbought
- Price touching lower band = oversold
- **Squeeze** = Low volatility, big move incoming

### Volume
Confirms price moves. A breakout on high volume is more reliable than on low volume.

These are the exact indicators our AI models use for predictions!`,
      },
      {
        index: 2,
        title: 'Trading Strategies',
        duration: 7,
        content: `## Trading Strategies

### Trend Following
Trade in the direction of the prevailing trend.
- Buy pullbacks in uptrends
- Sell rallies in downtrends
- Use moving averages to identify trend direction

### Mean Reversion
Assumes prices revert to their average.
- Buy when price is significantly below average
- Sell when significantly above
- Works best in ranging markets

### Breakout Trading
Enter when price breaks above resistance or below support.
- Wait for confirmation (candle close above/below)
- Volume should increase on the breakout

### Dollar Cost Averaging (DCA)
Invest a fixed amount at regular intervals regardless of price.
- Removes emotion from timing
- Reduces impact of volatility
- Best for long-term investors

### Position Sizing
Never risk more than 1-2% of your portfolio on a single trade. This is the most important rule in trading.`,
      },
      {
        index: 3,
        title: 'Risk Management',
        duration: 7,
        content: `## Risk Management

Risk management separates successful traders from those who blow up their accounts.

### Stop Losses
A stop loss automatically closes your position at a predetermined price to limit losses.

**Example:** Buy BTC at $80,000. Set stop loss at $76,000 (5% risk).

### Risk/Reward Ratio
Only take trades where potential reward exceeds risk.
- Minimum 1:2 ratio (risk $1 to make $2)
- 1:3 or better is ideal

### Portfolio Allocation
- Never put all funds in one asset
- Diversify across different crypto sectors
- Keep some in stablecoins for opportunities

### Emotional Discipline
- **FOMO** (Fear of Missing Out) causes buying tops
- **FUD** (Fear, Uncertainty, Doubt) causes selling bottoms
- Stick to your plan — don't chase pumps

### The 1% Rule
Never risk more than 1% of total portfolio on a single trade. With a $10,000 portfolio, max loss per trade = $100.

**Remember:** Preserving capital is more important than making gains.`,
      },
    ],
    quiz: [
      {
        id: 1,
        question: 'An RSI reading above 70 indicates:',
        options: ['Strong buy signal', 'Oversold conditions', 'Overbought conditions', 'Neutral market'],
        correct: 2,
        explanation: 'RSI above 70 indicates overbought conditions, suggesting the asset may be due for a pullback.',
      },
      {
        id: 2,
        question: 'What does a Bollinger Band "squeeze" indicate?',
        options: [
          'The asset is overbought',
          'Low volatility with a big move likely incoming',
          'A confirmed downtrend',
          'High trading volume',
        ],
        correct: 1,
        explanation: 'A Bollinger Band squeeze (bands narrowing) indicates low volatility and often precedes a significant price move in either direction.',
      },
      {
        id: 3,
        question: 'What is the "1% Rule" in trading?',
        options: [
          'Only invest 1% of income in crypto',
          'Take profits at 1% gain',
          'Never risk more than 1% of portfolio on one trade',
          'Rebalance portfolio every 1% move',
        ],
        correct: 2,
        explanation: 'The 1% rule means never risking more than 1% of your total portfolio on a single trade, protecting against catastrophic losses.',
      },
      {
        id: 4,
        question: 'What is FOMO in trading?',
        options: [
          'A technical indicator',
          'Fear of Missing Out — buying due to emotional pressure',
          'A type of stop loss order',
          'A DeFi protocol',
        ],
        correct: 1,
        explanation: 'FOMO (Fear of Missing Out) causes traders to buy at market tops due to emotional pressure, often leading to losses.',
      },
      {
        id: 5,
        question: 'Which strategy involves investing fixed amounts at regular intervals?',
        options: ['Breakout trading', 'Mean reversion', 'Dollar Cost Averaging', 'Trend following'],
        correct: 2,
        explanation: 'Dollar Cost Averaging (DCA) involves investing a fixed amount at regular intervals, reducing the impact of volatility over time.',
      },
    ],
  },
];

export const getCourse = (slug: string): Course | undefined =>
  COURSES.find(c => c.slug === slug);

export const PASSING_SCORE = 60; // 60% to pass
