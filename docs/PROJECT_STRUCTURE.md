# Project Structure

## Directory Layout

```
trader-journal/
├── .github/                    # GitHub workflows, PR templates
├── docs/                       # Project documentation
│   ├── TECH_STACK.md
│   ├── PROJECT_STRUCTURE.md
│   ├── DATABASE_SCHEMA.md
│   └── API_REFERENCE.md
├── memory-bank/                # Project context for AI assistance
├── public/                     # Static assets
│   └── favicon.ico
├── src/
│   ├── app/                    # Application entry point
│   │   ├── App.tsx             # Root component
│   │   ├── providers.tsx       # All providers wrapper
│   │   ├── routes.tsx          # Route definitions
│   │   └── store.ts            # Redux store configuration
│   │
│   ├── components/             # Shared UI components
│   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── layout/             # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MainLayout.tsx
│   │   │   └── AuthLayout.tsx
│   │   └── common/             # Common reusable components
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── ProtectedRoute.tsx
│   │
│   ├── features/               # Feature modules
│   │   ├── auth/               # Authentication feature
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── ForgotPasswordForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── RegisterPage.tsx
│   │   │   └── authSlice.ts
│   │   │
│   │   ├── trades/             # Trades management feature
│   │   │   ├── components/
│   │   │   │   ├── TradeForm.tsx
│   │   │   │   ├── TradeCard.tsx
│   │   │   │   ├── TradeTable.tsx
│   │   │   │   ├── TradeFilters.tsx
│   │   │   │   ├── TradeDetails.tsx
│   │   │   │   └── TradeImport.tsx     # MetaTrader import
│   │   │   ├── hooks/
│   │   │   │   ├── useTrades.ts
│   │   │   │   └── useTradeFilters.ts
│   │   │   ├── pages/
│   │   │   │   ├── TradesPage.tsx
│   │   │   │   ├── NewTradePage.tsx
│   │   │   │   ├── TradeDetailPage.tsx
│   │   │   │   └── ImportPage.tsx      # MT import page
│   │   │   ├── schemas/
│   │   │   │   └── tradeSchema.ts
│   │   │   └── tradesSlice.ts
│   │   │
│   │   ├── dashboard/          # Dashboard feature
│   │   │   ├── components/
│   │   │   │   ├── StatsCard.tsx
│   │   │   │   ├── EquityCurve.tsx
│   │   │   │   ├── RecentTrades.tsx
│   │   │   │   ├── PeriodSelector.tsx
│   │   │   │   └── QuickActions.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useDashboardStats.ts
│   │   │   └── pages/
│   │   │       └── DashboardPage.tsx
│   │   │
│   │   ├── analytics/          # Analytics feature (extended)
│   │   │   ├── components/
│   │   │   │   ├── PnLChart.tsx
│   │   │   │   ├── WinRateChart.tsx
│   │   │   │   └── DistributionChart.tsx
│   │   │   └── pages/
│   │   │       └── AnalyticsPage.tsx
│   │   │
│   │   ├── settings/           # Settings feature
│   │   │   ├── components/
│   │   │   │   ├── ProfileForm.tsx
│   │   │   │   └── PreferencesForm.tsx
│   │   │   └── pages/
│   │   │       └── SettingsPage.tsx
│   │   │
│   │   └── news/               # News feature (future)
│   │       ├── components/
│   │       └── pages/
│   │
│   ├── services/               # RTK Query API services
│   │   ├── api.ts              # Base API configuration
│   │   ├── authApi.ts          # Auth endpoints
│   │   ├── tradesApi.ts        # Trades CRUD endpoints
│   │   ├── profileApi.ts       # Profile endpoints
│   │   └── analyticsApi.ts     # Analytics endpoints
│   │
│   ├── lib/                    # External library configurations
│   │   ├── supabase.ts         # Supabase client
│   │   ├── i18n.ts             # i18next configuration
│   │   └── utils.ts            # cn() and other utils
│   │
│   ├── locales/                # i18n translations
│   │   ├── ru/
│   │   │   └── translation.json
│   │   └── en/
│   │       └── translation.json
│   │
│   ├── hooks/                  # Shared custom hooks
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   └── useMediaQuery.ts
│   │
│   ├── types/                  # TypeScript types
│   │   ├── trade.ts
│   │   ├── user.ts
│   │   ├── analytics.ts
│   │   └── supabase.ts         # Generated Supabase types
│   │
│   ├── utils/                  # Utility functions
│   │   ├── formatters.ts       # Currency, date formatting
│   │   ├── calculations.ts     # Trade calculations (R, PnL, etc.)
│   │   └── validators.ts       # Validation helpers
│   │
│   ├── constants/              # Application constants
│   │   ├── markets.ts          # Market types
│   │   ├── routes.ts           # Route paths
│   │   └── defaults.ts         # Default values
│   │
│   ├── styles/                 # Global styles
│   │   └── globals.css
│   │
│   ├── main.tsx                # Entry point
│   └── vite-env.d.ts           # Vite types
│
├── supabase/                   # Supabase configuration
│   ├── migrations/             # Database migrations
│   └── seed.sql                # Seed data
│
├── electron/                   # Electron files (future)
│   ├── main.ts
│   ├── preload.ts
│   └── electron-builder.json
│
├── tests/                      # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example                # Environment variables template
├── .env.local                  # Local environment (gitignored)
├── .eslintrc.cjs               # ESLint config
├── .prettierrc                 # Prettier config
├── index.html                  # HTML entry point
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

## Feature Module Structure

Каждый feature module следует единой структуре:

```
feature/
├── components/     # UI компоненты специфичные для feature
├── hooks/          # Custom hooks для feature
├── pages/          # Page-level компоненты (подключаются к routes)
├── schemas/        # Zod schemas для валидации
├── utils/          # Feature-specific utilities
└── featureSlice.ts # Redux slice (если нужен UI state)
```

## Import Aliases

```typescript
// Использование алиасов
import { Button } from '@/components/ui/button'
import { TradeForm } from '@/features/trades/components/TradeForm'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { tradesApi } from '@/services/tradesApi'
import type { Trade } from '@/types/trade'
```

---
*Last updated: 2026-01-01*
