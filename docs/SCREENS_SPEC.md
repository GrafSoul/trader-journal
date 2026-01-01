# Screens Specification

## Routes Overview

| Route | Page | Auth Required | Description |
|-------|------|---------------|-------------|
| `/auth/login` | LoginPage | No | Вход в систему |
| `/auth/register` | RegisterPage | No | Регистрация |
| `/auth/forgot-password` | ForgotPasswordPage | No | Восстановление пароля |
| `/` | DashboardPage | Yes | Главный экран (redirect from /) |
| `/dashboard` | DashboardPage | Yes | Dashboard с метриками |
| `/trades` | TradesPage | Yes | Список сделок |
| `/trades/new` | NewTradePage | Yes | Создание сделки |
| `/trades/:id` | TradeDetailPage | Yes | Детали сделки |
| `/trades/:id/edit` | EditTradePage | Yes | Редактирование сделки |
| `/analytics` | AnalyticsPage | Yes | Расширенная аналитика |
| `/settings` | SettingsPage | Yes | Настройки профиля |
| `/news` | NewsPage | Yes | Лента новостей (future) |

---

## Screen Specifications

### 1. Login Page (`/auth/login`)

**Layout:** AuthLayout (centered card)

**Components:**
- Logo
- LoginForm
  - Email input
  - Password input
  - "Remember me" checkbox
  - Submit button
  - "Forgot password?" link
  - "Register" link

**Validation:**
- Email: valid email format
- Password: required, min 6 chars

**Actions:**
- Submit → Supabase signInWithPassword
- Success → redirect to /dashboard
- Error → show toast

---

### 2. Register Page (`/auth/register`)

**Layout:** AuthLayout

**Components:**
- Logo
- RegisterForm
  - Email input
  - Password input
  - Confirm password input
  - Submit button
  - "Already have account?" link

**Validation:**
- Email: valid email format
- Password: min 8 chars, uppercase, lowercase, number
- Confirm password: must match

**Actions:**
- Submit → Supabase signUp
- Success → show "Check your email" message
- Error → show toast

---

### 3. Dashboard Page (`/dashboard`)

**Layout:** MainLayout (sidebar + header)

**Components:**

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Period Selector | Filters (Market, Symbol, Strategy)│
├─────────────────────────────────────────────────────────────┤
│ Stats Cards Row:                                            │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │Net PnL  │ │Win Rate │ │Avg R    │ │Profit   │ │Trades   ││
│ │$1,234   │ │65%      │ │1.5R     │ │Factor   │ │Count    ││
│ │+12.5%   │ │         │ │         │ │2.1      │ │48       ││
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘│
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┐ ┌─────────────────────────────┐│
│ │ Equity Curve            │ │ PnL by Day                  ││
│ │ [Line Chart]            │ │ [Bar Chart]                 ││
│ │                         │ │                             ││
│ └─────────────────────────┘ └─────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│ Quick Actions:                                              │
│ [+ Add Trade] [Import] [Open Journal]                       │
├─────────────────────────────────────────────────────────────┤
│ Open/Planned Trades (if any):                               │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ EURUSD | Long | Entry: 1.0850 | SL: 1.0800 | Planned    ││
│ └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│ Recent Trades Table (last 10-20):                           │
│ ┌───────┬────────┬──────┬───────┬───────┬────────┬───────┐│
│ │Symbol │Side    │Entry │Exit   │PnL    │R       │Date   ││
│ ├───────┼────────┼──────┼───────┼───────┼────────┼───────┤│
│ │EURUSD │Long    │1.0850│1.0920 │+$350  │+2.1R   │Dec 30 ││
│ │XAUUSD │Short   │2050  │2070   │-$200  │-1.0R   │Dec 29 ││
│ └───────┴────────┴──────┴───────┴───────┴────────┴───────┘│
└─────────────────────────────────────────────────────────────┘
```

**Period Selector Options:**
- Today
- This Week
- This Month
- This Year
- Custom Range (date picker)
- All Time

**Data Source:** RTK Query → Supabase RPC function

---

### 4. Trades List Page (`/trades`)

**Layout:** MainLayout

**Components:**

```
┌─────────────────────────────────────────────────────────────┐
│ Header: [+ New Trade] [Export] [Bulk Actions]               │
├─────────────────────────────────────────────────────────────┤
│ Filters Bar:                                                │
│ [Search...] [Market ▼] [Status ▼] [Date Range] [Tags ▼]    │
├─────────────────────────────────────────────────────────────┤
│ Trades Table (virtualized for performance):                 │
│ ┌───────┬────────┬──────┬───────┬───────┬────────┬───────┐│
│ │Symbol │Side    │Entry │Exit   │PnL    │R       │Status ││
│ ├───────┼────────┼──────┼───────┼───────┼────────┼───────┤│
│ │...    │...     │...   │...    │...    │...     │...    ││
│ └───────┴────────┴──────┴───────┴───────┴────────┴───────┘│
├─────────────────────────────────────────────────────────────┤
│ Pagination: [< Prev] Page 1 of 10 [Next >]                  │
└─────────────────────────────────────────────────────────────┘
```

**Table Columns:**
- Checkbox (bulk select)
- Symbol
- Market (icon)
- Side (Long/Short with color)
- Status (badge)
- Entry Price
- Exit Price
- Volume
- PnL ($)
- PnL (%)
- R Multiple
- Open Time
- Strategy
- Tags
- Actions (view, edit, delete)

**Features:**
- Sortable columns
- Resizable columns (optional)
- Row click → navigate to detail
- Bulk delete
- Export to CSV

---

### 5. New Trade Page (`/trades/new`)

**Layout:** MainLayout

**Components:**

```
┌─────────────────────────────────────────────────────────────┐
│ Header: New Trade                                [Cancel]   │
├─────────────────────────────────────────────────────────────┤
│ Trade Form (multi-section):                                 │
│                                                             │
│ ── Basic Info ──────────────────────────────────────────── │
│ Market: [Forex ▼]  Symbol: [EURUSD    ]  Side: [Long|Short]│
│ Status: [Planned ▼]                                         │
│                                                             │
│ ── Timing ──────────────────────────────────────────────── │
│ Open Time: [Date Picker]  Close Time: [Date Picker]        │
│                                                             │
│ ── Prices ──────────────────────────────────────────────── │
│ Entry: [1.0850]  Stop Loss: [1.0800]  Take Profit: [1.0950]│
│ Exit: [        ] (optional)                                 │
│                                                             │
│ ── Volume ──────────────────────────────────────────────── │
│ Volume: [0.10]  Type: [Lots ▼]                             │
│ Commission: [2.00]  Swap: [0.00]                           │
│                                                             │
│ ── Risk ────────────────────────────────────────────────── │
│ Risk %: [1.00]  Risk $: [100.00]  (auto-calculate option)  │
│                                                             │
│ ── Results ─────────────────────────────────────────────── │
│ PnL: [auto]  PnL %: [auto]  R Multiple: [auto]             │
│                                                             │
│ ── Analysis ────────────────────────────────────────────── │
│ Strategy: [Breakout ▼]                                      │
│ Setup: [textarea - описание сетапа]                        │
│ Entry Reason: [textarea]                                    │
│ Exit Reason: [textarea]                                     │
│ Notes: [textarea]                                           │
│ Emotions: [textarea]                                        │
│ Tags: [tag input with suggestions]                          │
│                                                             │
│ ── Attachments ─────────────────────────────────────────── │
│ [Drop screenshots here or click to upload]                  │
│ [thumbnail] [thumbnail] [thumbnail]                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                              [Save as Draft] [Create Trade] │
└─────────────────────────────────────────────────────────────┘
```

**Auto-calculations:**
- PnL = (Exit - Entry) * Volume * pip value (учитывая side)
- R Multiple = PnL / Risk Amount
- PnL % = PnL / Account Balance (if known)

**Validation (Zod):**
- Symbol: required
- Side: required
- Volume: required, > 0
- Entry: required if status != planned
- Stop Loss: required (recommended)
- Prices: SL < Entry for Long, SL > Entry for Short

---

### 6. Trade Detail Page (`/trades/:id`)

**Layout:** MainLayout

**Components:**

```
┌─────────────────────────────────────────────────────────────┐
│ Header: EURUSD Long +$350 (+2.1R)     [Edit] [Delete]       │
│ Status: ● Closed                                            │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┐ ┌─────────────────────────────┐│
│ │ Trade Summary Card      │ │ Mini Chart (if available)   ││
│ │ Entry: 1.0850           │ │ [Price chart with marks]    ││
│ │ Exit: 1.0920            │ │                             ││
│ │ SL: 1.0800              │ │                             ││
│ │ TP: 1.0950              │ │                             ││
│ │ Volume: 0.10 lots       │ │                             ││
│ │ Duration: 4h 32m        │ │                             ││
│ └─────────────────────────┘ └─────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│ Results:                                                    │
│ PnL: +$350 | PnL%: +3.5% | R: +2.1R | Commission: $2       │
├─────────────────────────────────────────────────────────────┤
│ Analysis:                                                   │
│ Strategy: Breakout                                          │
│ Setup: [text]                                               │
│ Entry Reason: [text]                                        │
│ Exit Reason: [text]                                         │
│ Notes: [text]                                               │
│ Emotions: [text]                                            │
│ Tags: [tag] [tag] [tag]                                    │
├─────────────────────────────────────────────────────────────┤
│ Attachments:                                                │
│ [screenshot thumbnail] [screenshot thumbnail]               │
├─────────────────────────────────────────────────────────────┤
│ Event Log:                                                  │
│ • Dec 30, 10:00 - Trade opened                             │
│ • Dec 30, 12:30 - SL moved to 1.0820                       │
│ • Dec 30, 14:32 - Trade closed at TP                       │
└─────────────────────────────────────────────────────────────┘
```

---

### 7. Settings Page (`/settings`)

**Layout:** MainLayout

**Tabs:**
- Profile
- Trading Preferences
- Appearance
- (Future: Notifications, Integrations)

**Profile Section:**
- Display Name
- Email (read-only)
- Avatar (future)

**Trading Preferences:**
- Base Currency (USD, EUR, etc.)
- Timezone
- Default Risk %
- Default Risk Amount
- Default Market

**Appearance:**
- Theme (Light/Dark/System)
- Language (RU/EN - future)

---

## Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 640px | Sidebar hidden, bottom nav |
| Tablet | 640-1024px | Collapsible sidebar |
| Desktop | > 1024px | Full sidebar |

---

## Component Library (shadcn/ui)

Required components:
- `button`, `input`, `label`, `textarea`
- `card`, `table`, `badge`
- `select`, `checkbox`, `radio-group`
- `dialog`, `sheet`, `popover`
- `toast`, `alert`
- `tabs`, `accordion`
- `calendar`, `date-picker`
- `dropdown-menu`, `command` (for search)
- `form` (react-hook-form integration)
- `skeleton` (loading states)

---
*Last updated: 2026-01-01*
