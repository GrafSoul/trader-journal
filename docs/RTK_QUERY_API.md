# RTK Query API Reference

## API Structure

```typescript
// src/services/api.ts
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import { supabase } from '@/lib/supabase'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Trade', 'Profile', 'Stats'],
  endpoints: () => ({}),
})
```

## Auth API

```typescript
// src/services/authApi.ts
import { api } from './api'

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get current session
    getSession: builder.query<Session | null, void>({
      queryFn: async () => {
        const { data, error } = await supabase.auth.getSession()
        if (error) return { error }
        return { data: data.session }
      },
    }),

    // Sign in
    signIn: builder.mutation<AuthResponse, SignInCredentials>({
      queryFn: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) return { error }
        return { data }
      },
    }),

    // Sign up
    signUp: builder.mutation<AuthResponse, SignUpCredentials>({
      queryFn: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) return { error }
        return { data }
      },
    }),

    // Sign out
    signOut: builder.mutation<void, void>({
      queryFn: async () => {
        const { error } = await supabase.auth.signOut()
        if (error) return { error }
        return { data: undefined }
      },
      invalidatesTags: ['Profile', 'Trade', 'Stats'],
    }),

    // Reset password
    resetPassword: builder.mutation<void, string>({
      queryFn: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email)
        if (error) return { error }
        return { data: undefined }
      },
    }),
  }),
})

export const {
  useGetSessionQuery,
  useSignInMutation,
  useSignUpMutation,
  useSignOutMutation,
  useResetPasswordMutation,
} = authApi
```

## Profile API

```typescript
// src/services/profileApi.ts
import { api } from './api'
import type { Profile, ProfileUpdate } from '@/types/user'

export const profileApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get current user profile
    getProfile: builder.query<Profile, void>({
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: { message: 'Not authenticated' } }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) return { error }
        return { data }
      },
      providesTags: ['Profile'],
    }),

    // Update profile
    updateProfile: builder.mutation<Profile, ProfileUpdate>({
      queryFn: async (updates) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: { message: 'Not authenticated' } }

        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single()

        if (error) return { error }
        return { data }
      },
      invalidatesTags: ['Profile'],
    }),
  }),
})

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
} = profileApi
```

## Trades API

```typescript
// src/services/tradesApi.ts
import { api } from './api'
import type { Trade, TradeCreate, TradeUpdate, TradeFilters } from '@/types/trade'

export const tradesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get trades with filters
    getTrades: builder.query<{ data: Trade[]; count: number }, TradeFilters>({
      queryFn: async (filters) => {
        let query = supabase
          .from('trades')
          .select('*, trade_tags(tag)', { count: 'exact' })
          .order('created_at', { ascending: false })

        // Apply filters
        if (filters.market) {
          query = query.eq('market', filters.market)
        }
        if (filters.status) {
          query = query.eq('status', filters.status)
        }
        if (filters.symbol) {
          query = query.ilike('symbol', `%${filters.symbol}%`)
        }
        if (filters.startDate) {
          query = query.gte('open_time', filters.startDate)
        }
        if (filters.endDate) {
          query = query.lte('open_time', filters.endDate)
        }
        if (filters.side) {
          query = query.eq('side', filters.side)
        }

        // Pagination
        const from = ((filters.page || 1) - 1) * (filters.limit || 20)
        const to = from + (filters.limit || 20) - 1
        query = query.range(from, to)

        const { data, error, count } = await query

        if (error) return { error }
        return { data: { data: data || [], count: count || 0 } }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Trade' as const, id })),
              { type: 'Trade', id: 'LIST' },
            ]
          : [{ type: 'Trade', id: 'LIST' }],
    }),

    // Get single trade
    getTrade: builder.query<Trade, string>({
      queryFn: async (id) => {
        const { data, error } = await supabase
          .from('trades')
          .select(`
            *,
            trade_tags(tag),
            trade_attachments(*),
            trade_events(*)
          `)
          .eq('id', id)
          .single()

        if (error) return { error }
        return { data }
      },
      providesTags: (result, error, id) => [{ type: 'Trade', id }],
    }),

    // Create trade
    createTrade: builder.mutation<Trade, TradeCreate>({
      queryFn: async (trade) => {
        const { tags, ...tradeData } = trade

        // Insert trade
        const { data, error } = await supabase
          .from('trades')
          .insert(tradeData)
          .select()
          .single()

        if (error) return { error }

        // Insert tags if provided
        if (tags && tags.length > 0) {
          await supabase.from('trade_tags').insert(
            tags.map((tag) => ({ trade_id: data.id, tag }))
          )
        }

        return { data }
      },
      invalidatesTags: [{ type: 'Trade', id: 'LIST' }, 'Stats'],
    }),

    // Update trade
    updateTrade: builder.mutation<Trade, { id: string; updates: TradeUpdate }>({
      queryFn: async ({ id, updates }) => {
        const { tags, ...tradeData } = updates

        // Update trade
        const { data, error } = await supabase
          .from('trades')
          .update(tradeData)
          .eq('id', id)
          .select()
          .single()

        if (error) return { error }

        // Update tags if provided
        if (tags !== undefined) {
          // Delete existing tags
          await supabase.from('trade_tags').delete().eq('trade_id', id)
          
          // Insert new tags
          if (tags.length > 0) {
            await supabase.from('trade_tags').insert(
              tags.map((tag) => ({ trade_id: id, tag }))
            )
          }
        }

        return { data }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Trade', id },
        { type: 'Trade', id: 'LIST' },
        'Stats',
      ],
    }),

    // Delete trade
    deleteTrade: builder.mutation<void, string>({
      queryFn: async (id) => {
        const { error } = await supabase
          .from('trades')
          .delete()
          .eq('id', id)

        if (error) return { error }
        return { data: undefined }
      },
      invalidatesTags: (result, error, id) => [
        { type: 'Trade', id },
        { type: 'Trade', id: 'LIST' },
        'Stats',
      ],
    }),

    // Bulk delete trades
    bulkDeleteTrades: builder.mutation<void, string[]>({
      queryFn: async (ids) => {
        const { error } = await supabase
          .from('trades')
          .delete()
          .in('id', ids)

        if (error) return { error }
        return { data: undefined }
      },
      invalidatesTags: [{ type: 'Trade', id: 'LIST' }, 'Stats'],
    }),
  }),
})

export const {
  useGetTradesQuery,
  useGetTradeQuery,
  useCreateTradeMutation,
  useUpdateTradeMutation,
  useDeleteTradeMutation,
  useBulkDeleteTradesMutation,
} = tradesApi
```

## Analytics API

```typescript
// src/services/analyticsApi.ts
import { api } from './api'
import type { DashboardStats, StatsFilters } from '@/types/analytics'

export const analyticsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get dashboard stats
    getDashboardStats: builder.query<DashboardStats, StatsFilters>({
      queryFn: async (filters) => {
        const { data, error } = await supabase.rpc('get_dashboard_stats', {
          p_start_date: filters.startDate,
          p_end_date: filters.endDate,
          p_market: filters.market || null,
          p_symbol: filters.symbol || null,
        })

        if (error) return { error }
        return { data }
      },
      providesTags: ['Stats'],
    }),

    // Get equity curve data
    getEquityCurve: builder.query<EquityPoint[], StatsFilters>({
      queryFn: async (filters) => {
        const { data, error } = await supabase
          .from('trades')
          .select('close_time, pnl')
          .eq('status', 'closed')
          .gte('close_time', filters.startDate)
          .lte('close_time', filters.endDate)
          .order('close_time', { ascending: true })

        if (error) return { error }

        // Calculate cumulative equity
        let cumulative = 0
        const equityData = (data || []).map((trade) => {
          cumulative += trade.pnl || 0
          return {
            date: trade.close_time,
            equity: cumulative,
          }
        })

        return { data: equityData }
      },
      providesTags: ['Stats'],
    }),

    // Get PnL by day
    getPnlByDay: builder.query<DailyPnl[], StatsFilters>({
      queryFn: async (filters) => {
        const { data, error } = await supabase
          .from('trades')
          .select('close_time, pnl')
          .eq('status', 'closed')
          .gte('close_time', filters.startDate)
          .lte('close_time', filters.endDate)

        if (error) return { error }

        // Group by day
        const byDay = (data || []).reduce((acc, trade) => {
          const day = new Date(trade.close_time).toISOString().split('T')[0]
          acc[day] = (acc[day] || 0) + (trade.pnl || 0)
          return acc
        }, {} as Record<string, number>)

        const result = Object.entries(byDay).map(([date, pnl]) => ({
          date,
          pnl,
        }))

        return { data: result }
      },
      providesTags: ['Stats'],
    }),
  }),
})

export const {
  useGetDashboardStatsQuery,
  useGetEquityCurveQuery,
  useGetPnlByDayQuery,
} = analyticsApi
```

## Type Definitions

```typescript
// src/types/trade.ts
export type MarketType = 'forex' | 'crypto' | 'stocks' | 'futures' | 'options' | 'other'
export type TradeSide = 'long' | 'short'
export type TradeStatus = 'planned' | 'opened' | 'closed' | 'canceled'
export type VolumeType = 'lots' | 'units' | 'contracts'

export interface Trade {
  id: string
  user_id: string
  market: MarketType
  symbol: string
  side: TradeSide
  status: TradeStatus
  open_time: string | null
  close_time: string | null
  entry: number | null
  stop_loss: number | null
  take_profit: number | null
  exit_price: number | null
  volume: number
  volume_type: VolumeType
  commission: number
  swap: number
  risk_percent: number | null
  risk_amount: number | null
  pnl: number | null
  pnl_percent: number | null
  r_multiple: number | null
  strategy: string | null
  setup: string | null
  entry_reason: string | null
  exit_reason: string | null
  notes: string | null
  emotions: string | null
  created_at: string
  updated_at: string
  trade_tags?: { tag: string }[]
  trade_attachments?: TradeAttachment[]
  trade_events?: TradeEvent[]
}

export interface TradeFilters {
  market?: MarketType
  status?: TradeStatus
  side?: TradeSide
  symbol?: string
  strategy?: string
  tags?: string[]
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

// src/types/analytics.ts
export interface DashboardStats {
  total_trades: number
  closed_trades: number
  winning_trades: number
  losing_trades: number
  net_pnl: number
  win_rate: number
  avg_r: number
  profit_factor: number
  best_trade: number
  worst_trade: number
  avg_win: number
  avg_loss: number
}

export interface StatsFilters {
  startDate: string
  endDate: string
  market?: MarketType
  symbol?: string
}
```

---
*Last updated: 2026-01-01*
