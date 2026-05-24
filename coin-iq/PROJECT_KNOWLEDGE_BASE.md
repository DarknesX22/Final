# Coin-IQ Project Knowledge Base

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Authentication System](#authentication-system)
4. [Database Schema](#database-schema)
5. [API Integrations](#api-integrations)
6. [UI Components](#ui-components)
7. [Navigation Structure](#navigation-structure)
8. [News & Data Feeds](#news--data-feeds)
9. [Deployment & Environment](#deployment--environment)
10. [Troubleshooting](#troubleshooting)

---

## Project Overview

Coin-IQ is a cryptocurrency prediction and analysis platform built with Next.js. The platform provides real-time market data, predictions, analytics, and news related to cryptocurrencies. It features a modern black and white aesthetic with smooth animations and responsive design.

### Core Features
- Real-time cryptocurrency market data visualization
- AI-powered market trend predictions
- Interactive analytics dashboards
- Cryptocurrency news feed
- User authentication system
- Portfolio tracking capabilities

---

## Technology Stack

### Core Technologies
- **Frontend Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Runtime**: Node.js

### UI Components
- Custom Card components
- Button variants
- Animated Stat Cards
- Crypto Icons
- Navigation components
- Form elements

### State Management
- React Hooks (useState, useEffect, useContext)
- Client-side state management

---

## Authentication System

### Authentication Flow
The project implements a comprehensive authentication system with the following components:

#### Backend Implementation
- **API Routes**: Located in `src/app/api/auth/[...nextauth]/route.ts`
- **Authentication Provider**: NextAuth.js integration
- **Database Adapter**: PostgreSQL adapter for user sessions
- **JWT Strategy**: Secure token-based authentication

#### User Registration Process
1. User navigates to `/signup` page
2. Form collects user information (name, email, password)
3. Password is securely hashed before storage
4. New user record is created in the database
5. User receives confirmation and is redirected to login

#### Login Process
1. User accesses `/login` page
2. Credentials are verified against database
3. Session token is generated
4. User is redirected to dashboard or previous location

#### Protected Routes
- Dashboard (`/dashboard`) requires authentication
- Profile editing (`/profile/edit`) requires authentication
- API routes are protected with middleware

#### Session Management
- Sessions are stored securely in the database
- Automatic session expiration
- Secure cookie handling

#### Logout Process
- Session is invalidated in the database
- Cookies are cleared
- User is redirected to homepage

### Security Measures
- Password hashing using bcrypt
- CSRF protection
- Secure session handling
- Input validation and sanitization

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Related Tables
- **Sessions**: Manages user sessions
- **Accounts**: OAuth provider integrations
- **Verification Tokens**: Email verification system

### Database Initialization
The project includes an initialization script that:
1. Creates necessary database tables
2. Sets up authentication-related schemas
3. Establishes proper relationships

---

## API Integrations

### Cryptocurrency Data
- **Primary API**: CoinGecko API for real-time market data
- **Data Types**: Prices, market caps, trading volumes, historical data
- **Rate Limiting**: Implemented to respect API limits
- **Caching**: Local caching to reduce API calls

### News Integration
- **Primary API**: CryptoCompare API for cryptocurrency news
- **Fallback**: Custom API integration for news retrieval
- **Data Fields**: Headlines, sources, publication dates, thumbnails

### Environment Configuration
API keys and endpoints are configured via environment variables:
- `NEXT_PUBLIC_COINGECKO_API_KEY` - CoinGecko API key
- `NEXT_PUBLIC_CRYPTOCONTROL_API_KEY` - CryptoControl API key
- `DATABASE_URL` - PostgreSQL connection string

---

## UI Components

### Navigation Components
- **Navbar**: Fixed-position navigation with responsive design
- **Mobile Menu**: Collapsible menu for smaller screens
- **Authentication Links**: Dynamic rendering based on user status

### Data Visualization
- **Stat Cards**: Animated statistics display
- **Charts**: Market trend visualizations
- **Prediction Panels**: AI-generated forecasts
- **Crypto Tickers**: Real-time price movement displays

### Interactive Elements
- **Buttons**: Various styles and sizes
- **Cards**: Hover effects and animations
- **Forms**: Validation and submission handling
- **Modals**: Overlay dialogs for user interactions

### Animation System
- **Framer Motion**: Smooth entrance and hover animations
- **Page Transitions**: Cross-page animation consistency
- **Loading States**: Skeleton screens and spinners

---

## Navigation Structure

### Main Navigation Items
- **Home** (`/`) - Landing page with overview
- **Predictions** (`/predictions`) - AI-generated market forecasts
- **Analytics** (`/analytics`) - Detailed market analysis
- **Markets** (`/markets`) - Comprehensive cryptocurrency listings
- **News** (`/news`) - Latest cryptocurrency news
- **About** (`/about`) - Company and product information

### Authenticated User Navigation
- **Dashboard** (`/dashboard`) - Personalized user experience
- **Profile** (`/profile/edit`) - Account settings and information

### Mobile Responsiveness
- Hamburger menu for small screens
- Stacked navigation on mobile
- Optimized touch targets
- Responsive grid layouts

---

## News & Data Feeds

### Cryptocurrency News Page
- **Real-time Updates**: Live news feed from cryptocurrency sources
- **Card Layout**: Visually appealing article presentation
- **Interactive Elements**: Read more links to source articles
- **Loading States**: Smooth loading animations

### Market Data Display
- **Real-time Ticker**: Continuous price movement display
- **Responsive Grids**: Adaptable layouts for different screen sizes
- **Data Points**: Prices, changes, market caps, volumes
- **Visual Indicators**: Color-coded changes (green/red)

### Data Refresh Mechanisms
- **Automatic Updates**: Periodic data refresh
- **Manual Refresh**: User-initiated updates
- **Error Handling**: Graceful degradation when APIs are unavailable

---

## Deployment & Environment

### Environment Variables
Required environment variables for proper operation:

```
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/coin_iq_db"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# API Keys
NEXT_PUBLIC_COINGECKO_API_KEY="your-coingecko-key"
NEXT_PUBLIC_CRYPTOCONTROL_API_KEY="your-cryptocontrol-key"

# PostgreSQL Credentials
DB_USER="postgres"
DB_PASS="123"
```

### Build Process
1. Install dependencies: `npm install`
2. Build application: `npm run build`
3. Start production server: `npm start`

### Development Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Initialize database: `npm run init-db` (if available)
5. Start development server: `npm run dev`

---

## Troubleshooting

### Common Issues

#### Authentication Problems
**Issue**: Users unable to register/login
**Solution**: 
- Verify database connection
- Check that users table exists
- Validate environment variables
- Ensure NEXTAUTH_SECRET is set

#### Database Connection Issues
**Issue**: Authentication fails with database errors
**Solution**:
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Confirm user has proper permissions
- Run database initialization if needed

#### API Integration Failures
**Issue**: No cryptocurrency data showing
**Solution**:
- Verify API keys are valid
- Check network connectivity
- Confirm API rate limits aren't exceeded
- Validate API response handling

#### UI Rendering Problems
**Issue**: Components not displaying correctly
**Solution**:
- Clear browser cache
- Check for JavaScript errors
- Verify component imports
- Confirm Tailwind CSS is properly configured

#### Build Failures
**Issue**: Application fails to build
**Solution**:
- Clean node_modules: `rm -rf node_modules package-lock.json`
- Reinstall dependencies: `npm install`
- Check for TypeScript errors
- Verify all imports are valid

### Performance Optimization
- Implement proper data caching
- Optimize API calls with debouncing
- Use lazy loading for images
- Minimize bundle sizes
- Enable gzip compression

### Security Best Practices
- Regular dependency updates
- Input validation on all forms
- Secure session management
- Environment variable protection
- Rate limiting for API endpoints