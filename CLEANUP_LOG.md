# Coin-IQ Dead Code Cleanup Log

**Date:** 2026-06-03  
**Scope:** `coin-iq/` — Next.js frontend + API routes  
**Method:** Static reference analysis across all `.ts` / `.tsx` files before any deletion.  
All items below were confirmed to have **zero references** in the live codebase before removal.

---

## 1. Deleted Files

### `src/lib/` — Library / Service files

| File | Reason |
|------|--------|
| `src/lib/authTest.ts` | Development-only testing utility (`createTestUser`, `validateAuthFlow`). Never imported anywhere in the app. |
| `src/lib/newsService.ts` | Old news API wrapper using CryptoCompare/CryptoControl. The news route (`/api/news/route.ts`) uses `xml2js` + RSS feeds directly and never imports this file. |
| `src/lib/dbSetup.ts` | Exports `initializeDatabase` and `testConnection`. Neither function is called from any app code or script. |
| `src/lib/emailService.ts` | Email helper wrapper. Never imported — email logic is handled inline inside individual API routes. |
| `src/lib/passwordResetService.ts` | Password reset helper functions. Never imported — reset routes import from `userService` directly. |
| `src/lib/oauthService.ts` | OAuth provider helper (Google/Facebook). Never imported — OAuth buttons were removed from all auth forms. |
| `src/lib/lms-schema-v2.sql` | Stale/superseded SQL schema file for LMS. `lms-schema.sql` is the active version. Never referenced in any script or seeder. |

### `src/components/` — UI Components

| File | Reason |
|------|--------|
| `src/components/graphics/cryptocurrency-graphic.tsx` | Animated SVG graphic component. Never imported or rendered anywhere. |
| `src/components/ui/separator.tsx` | Simple horizontal rule component. Never imported anywhere. |
| `src/components/charts/sentiment-analysis.tsx` | Sentiment chart component. Never imported or rendered anywhere. |
| `src/components/TestimonialsCarousel.tsx` | Old testimonials carousel (replaced by `InfiniteTestimonials`). Still imported in `page.tsx` but never rendered as JSX — import removed. |

### `src/app/api/auth/oauth/` — OAuth API Routes

| File | Reason |
|------|--------|
| `src/app/api/auth/oauth/google/route.ts` | Google OAuth initiation endpoint. No frontend button or link calls this route. |
| `src/app/api/auth/oauth/google/callback/route.ts` | Google OAuth callback. No frontend flow triggers this. |
| `src/app/api/auth/oauth/facebook/route.ts` | Facebook OAuth initiation endpoint. No frontend button calls this. |
| `src/app/api/auth/oauth/facebook/callback/route.ts` | Facebook OAuth callback. No frontend flow triggers this. |

---

## 2. Stale Imports Removed

### `src/app/page.tsx`

These were imported at the top of the home page but **never rendered as JSX**:

| Import | Component/Value |
|--------|----------------|
| `Card`, `CardContent` | from `@/components/ui/card` |
| `Button` | from `@/components/ui/button` |
| `PredictionPreview` | from `@/components/prediction-preview` |
| `AnimatedStatCard` | from `@/components/ui/AnimatedStatCard` |
| `TestimonialsCarousel` | from `@/components/TestimonialsCarousel` (file also deleted) |
| `CandlestickChart` | from `@/components/charts/candlestick-chart` |
| `LineChart` | from `@/components/charts/line-chart` |
| `RiskAssessment` | from `@/components/charts/risk-assessment` |

### Dead state & functions removed from `src/app/page.tsx`

| Symbol | Reason |
|--------|--------|
| `selectedPeriod` / `setSelectedPeriod` | State for chart period selector — no chart is rendered on the home page |
| `generateChartData(period)` | ~80-line function generating mock chart data — nothing consumed it |
| `chartData` / `setChartData` | State holding the generated chart data — unused |
| `updateChartData(period)` | Convenience wrapper calling `setSelectedPeriod` + `setChartData` — unused |

---

## 3. Dead Type Definitions Removed

### `src/types/crypto.ts`

| Interface | Reason |
|-----------|--------|
| `PredictionData` | Never referenced in any file. `prediction-dashboard.tsx` defines its own local prediction type. |
| `MarketMetrics` | Never referenced in any file. |

---

## 4. Unused npm Dependencies Removed from `package.json`

| Package | Reason |
|---------|--------|
| `@sendgrid/mail` | No `import` in any source file |
| `@types/nodemailer` | No `import` in any source file; `emailService.ts` also deleted |
| `nodemailer` | No `import` in any source file |
| `googleapis` | No `import` in any source file |
| `google-auth-library` | No `import` in any source file; OAuth routes also deleted |
| `jwt-decode` | No `import` in any source file |
| `date-fns` | No `import` in any source file |
| `cross-env` | Not used in any npm script |
| `resend` | No `import` in any source file |
| `@types/axios` | Redundant — `axios` ships its own TypeScript types |

---

## 5. What Was Preserved (Intentionally NOT deleted)

| Item | Reason kept |
|------|-------------|
| `src/lib/cryptoService.ts` | Used by `dashboard/page.tsx` (`getCryptoData`) |
| `src/lib/coingecko-api.ts` | Used by `/api/crypto/route.ts`, `/api/crypto/[id]`, `/api/crypto/history/[id]` |
| `src/components/prediction-dashboard.tsx` | Actively rendered in `src/app/predictions/page.tsx` |
| `src/components/charts/candlestick-chart.tsx` | Used inside `prediction-dashboard.tsx` |
| `src/components/charts/line-chart.tsx` | Used inside `prediction-dashboard.tsx` |
| `src/components/charts/risk-assessment.tsx` | Used inside `prediction-dashboard.tsx` |
| `src/hooks/usePrediction.ts` | Used inside `prediction-dashboard.tsx` |
| `src/hooks/useCryptoData.ts` | Used inside `prediction-dashboard.tsx` and `coins/page.tsx` |
| `src/components/CryptoDetailsModal.tsx` | Rendered in `src/app/markets/page.tsx` |
| `src/components/ui/AnimatedStatCard.tsx` | File kept — only the stale import removed from `page.tsx` |
| `src/app/api/auth/oauth/` dirs | Empty folders left — Next.js ignores empty route dirs |
| All admin routes | Actively used by `/admin/page.tsx` |
| All learn/LMS routes | Actively used by `/learn/` pages |
| All prediction routes | Actively used by dashboard and history features |
| `src/lib/schema.sql` | Referenced by `init-db.ts` script |
| `src/lib/lms-schema.sql` | Referenced by `init-lms.ts` script |

---

## 6. Empty Directories (left in place)

These directories are empty and safe to delete manually if desired, but were left since Next.js ignores them:

- `src/app/admin/api/`
- `src/app/api/auth/otp/reset-password/`
- `src/app/api/auth/otp/verify/`
- `src/app/api/auth/oauth/google/` (after route deletion)
- `src/app/api/auth/oauth/facebook/` (after route deletion)
