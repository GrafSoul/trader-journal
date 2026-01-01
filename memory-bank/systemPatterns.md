# System Patterns

## Architecture Patterns

### Layer Separation
```
┌─────────────────────────────────────────┐
│  UI Components (Presentational)         │
│  - Pure components, no business logic   │
│  - shadcn/ui + TailwindCSS              │
├─────────────────────────────────────────┤
│  Feature Modules                        │
│  - Screen-level logic                   │
│  - Container components                 │
│  - Feature-specific hooks               │
├─────────────────────────────────────────┤
│  Data Layer (RTK Query)                 │
│  - API endpoints                        │
│  - Caching, invalidation                │
│  - Optimistic updates                   │
├─────────────────────────────────────────┤
│  Store Slices                           │
│  - UI state                             │
│  - Filters, preferences                 │
│  - Auth state                           │
├─────────────────────────────────────────┤
│  Supabase Client                        │
│  - Auth, Database, Storage              │
│  - Row Level Security                   │
└─────────────────────────────────────────┘
```

### RTK Query Pattern
- Endpoints для Supabase через supabase-js
- Tag-based cache invalidation
- Optimistic updates для CRUD операций
- Prefetching для навигации

### Auth Pattern
- Supabase Auth (email/password)
- Session хранение через Supabase client
- Protected routes через React Router
- RLS на уровне БД для изоляции данных

### Form Pattern
- React Hook Form для state management
- Zod schemas для валидации
- Переиспользуемые form components
- Error handling с toast notifications

### Component Pattern
```typescript
// Presentational Component
export function TradeCard({ trade, onEdit, onDelete }: TradeCardProps) { }

// Container Component (Feature)
export function TradeListContainer() {
  const { data, isLoading } = useGetTradesQuery();
  return <TradeList trades={data} />;
}
```

## Coding Standards

### TypeScript
- Strict mode enabled
- Explicit return types for functions
- Interface over type for objects
- Zod schemas as single source of truth

### File Naming
- Components: PascalCase (`TradeCard.tsx`)
- Hooks: camelCase with `use` prefix (`useTrades.ts`)
- Utils: camelCase (`formatCurrency.ts`)
- Types: PascalCase (`Trade.ts`)

### Import Order
1. React/external libraries
2. Internal aliases (@/components, @/features, etc.)
3. Relative imports
4. Types (type-only imports)

### State Management
- Server state: RTK Query
- UI state: Redux slices (minimal)
- Form state: React Hook Form
- URL state: React Router

---
*Last updated: 2026-01-01*
