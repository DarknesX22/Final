# Coin-IQ: Cryptocurrency Prediction Platform

A modern cryptocurrency prediction and analysis platform built with Next.js, Tailwind CSS, and Framer Motion. The platform provides real-time market data, AI-powered forecasts for major cryptocurrencies with confidence scores, market analytics, and cryptocurrency news.

## Features

- **Real-time Market Data**: Live cryptocurrency prices and market information
- **AI-Powered Predictions**: Forecasts with confidence scores and risk assessments
- **Market Analytics**: Comprehensive data visualization and analytics
- **Cryptocurrency News**: Live news feed with articles from various sources
- **Modern UI/UX**: Sleek black and white design with smooth animations
- **Responsive Design**: Fully responsive across all device sizes
- **Smooth Animations**: Framer Motion for engaging user interactions
- **Authentication System**: Secure user registration and login with support for email/password and social media accounts (Google and Facebook), plus secure password reset functionality

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Language**: TypeScript
- **Package Manager**: npm
- **APIs**: CoinGecko API, CryptoCompare API
- **Database**: PostgreSQL

## Project Structure

```
coin-iq/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── analytics/       # Analytics page
│   │   ├── predictions/     # Predictions page
│   │   ├── favicon.ico
│   │   ├── globals.css      # Global styles and theme
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # Reusable components
│   │   ├── navbar.tsx       # Navigation bar
│   │   └── providers.tsx    # Framer Motion provider
│   ├── public/              # Static assets
└── README.md
```

## Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd coin-iq
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=postgres
DB_PASS=123
DB_NAME=coin_iq
DB_PORT=5432

# JWT Secret
JWT_SECRET=coin_iq_secret_key_change_this_in_production

# Application Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# API Keys
NEXT_PUBLIC_COINGECKO_API_KEY="your-coingecko-api-key"
NEXT_PUBLIC_CMC_API_KEY="your-coinmarketcap-api-key"
NEXT_PUBLIC_COINDESK_API_KEY="your-coindesk-api-key"

# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret

# Resend Configuration for Password Reset Emails
RESEND_API_KEY=your_resend_api_key
RESEND_FROM=onboarding@resend.dev
```

4. Initialize the database:
```bash
# Make sure PostgreSQL is running
npm run init-db  # If available, or manually run SQL migrations
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

## Design Principles

### Color Scheme
- **Primary**: Black (#000000) for text and accents
- **Secondary**: White (#FFFFFF) for backgrounds
- **Accents**: Grayscale for supporting elements
- **Status**: Green for positive changes, Red for negative changes

### Animation Strategy
- **Page Transitions**: Fade-in animations for content
- **Interactive Elements**: Hover and tap effects using Framer Motion
- **Data Visualization**: Animated charts and progress bars
- **Micro-interactions**: Subtle animations for user feedback

## Key Components

### Navigation Bar
- Responsive design with mobile menu
- Animated menu items
- Fixed positioning with backdrop blur

### Prediction Components
- Interactive cryptocurrency selector
- Confidence indicators with animated progress bars
- Market analysis cards with risk assessment

### Analytics Components
- Time range selector
- Tab navigation for different analytics views
- Visual data representations with animated charts
- Performance tables for top/worst performers

## Best Practices Implemented

1. **Component Organization**: Reusable components in the `components` directory
2. **Type Safety**: Full TypeScript support throughout
3. **Performance**: Optimized animations and lazy loading
4. **Accessibility**: Semantic HTML and proper ARIA attributes
5. **Responsive Design**: Mobile-first approach with Tailwind's responsive utilities

## Current Features

- ✅ Real-time cryptocurrency data integration via CoinGecko API
- ✅ Live cryptocurrency news feed with multiple sources
- ✅ User authentication system with secure login/registration
- ✅ OAuth Integration: Google and Facebook social login support
- ✅ Password Reset: Secure email-based password reset with time-limited tokens
- ✅ Personalized dashboards and profile management
- ✅ Responsive design for all device sizes
- ✅ Smooth animations and micro-interactions
- ✅ Comprehensive market analytics
- ✅ AI-powered cryptocurrency predictions

## Potential Future Enhancements

- Advanced charting libraries (e.g., Chart.js or D3.js) for enhanced data visualization
- Machine learning model integration for more accurate predictions
- WebSocket connections for real-time streaming data
- Dark/light mode toggle functionality
- Portfolio tracking and management features
- Advanced trading signals and alerts

## Learn More

To learn more about the technologies used in this project, check out the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [Tailwind CSS](https://tailwindcss.com/docs) - Learn how to style with Tailwind
- [Framer Motion](https://www.framer.com/motion/) - Learn about animations
- [TypeScript](https://www.typescriptlang.org/) - Learn about TypeScript

## Deploy on Vercel

The easiest way to deploy this application is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.