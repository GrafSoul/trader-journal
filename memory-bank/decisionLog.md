# Decision Log

## [2026-01-01 11:23:00] - Initial Tech Stack Selection

### Decision
Выбран следующий технологический стек для проекта:

| Category | Technology | Version | Rationale |
|----------|------------|---------|-----------|
| Framework | React | 19.2.x | Latest stable, новые features (Server Components ready) |
| Language | TypeScript | 5.4+ | Type safety, лучший DX |
| State | Redux Toolkit | 2.11.x | RTK Query для data fetching |
| UI | HeroUI | 2.x | Ранее NextUI, на базе React Aria + Tailwind |
| Styling | TailwindCSS | 4.1.x | Новая версия, лучшая производительность |
| Icons | Lucide React | 0.562.x | Современные, легковесные (HeroUI включает свои) |
| Forms | React Hook Form | latest | + Zod для валидации |
| Routing | React Router | 7.x | Новые features, data loading |
| Charts | Recharts | 3.6.x | Для статистики |
| Trading Charts | TradingView LWC | 5.1.x | Для графиков котировок |
| Backend | Supabase | 2.89.x | Auth + Postgres + RLS |
| Build | Vite | 7.x | Fast HMR, ESM native |
| Desktop | Electron | 39.x | Cross-platform desktop |

### Alternatives Considered
- **UI Kit:** shadcn/ui, MUI, Ant Design — выбран HeroUI по решению пользователя
- **State:** Zustand/Jotai — отклонены, RTK лучше для сложных data flows
- **Charts:** ECharts — отклонен, Recharts проще для React интеграции (FUTURE)

---

## [2026-01-01 11:49:00] - MVP Scope Clarification

### Decision
Уточнен scope MVP:
- **Включено:** Auth, Trade Journal CRUD, MetaTrader Import, i18n (RU/EN)
- **Отложено:** News, Charts, Advanced Analytics

### Rationale
Фокус на core функциональности журнала. News и Charts требуют внешних API и могут быть добавлены позже.

### MetaTrader Import
Формат импорта:
- **MT4/MT5 CSV** — экспорт из History Center
- **Поля:** Ticket, Open Time, Type, Size, Symbol, Price, S/L, T/P, Close Time, Close Price, Commission, Swap, Profit

### i18n Decision
- Использовать i18next + react-i18next
- Языки: RU (основной), EN
- Структура: `src/locales/{lang}/translation.json`

### Implications
- Нужно настроить Vite с React + TypeScript
- Настроить TailwindCSS v4 (новый синтаксис конфигурации)
- RTK Query endpoints для Supabase
- Electron-совместимая архитектура с первого дня

---

## [2026-01-01 11:23:00] - Project Structure Decision

### Decision
Использовать feature-based структуру с четким разделением слоев.

### Rationale
- Легко масштабируется
- Четкие границы между features
- Простой рефакторинг при росте проекта
- Electron-ready (бизнес-логика изолирована от UI)

---
*Last updated: 2026-01-01*
