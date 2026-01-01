# Trader Journal

Дневник Трейдера — приложение для ведения и анализа сделок.

## Features (MVP)

- 🔐 **Auth** — регистрация/авторизация через Supabase
- 📝 **Trade Journal** — ведение сделок с тегами и фильтрами
- 📥 **MetaTrader Import** — импорт сделок из MT4/MT5 (CSV)
- 📊 **Dashboard** — базовая статистика
- 🌐 **i18n** — русский и английский языки
- 🌙 **Dark Mode** — темная тема
- 🖥️ **Electron Ready** — архитектура готова к desktop

## Features (Future)

- 📰 **News** — ForexFactory API
- 📈 **Advanced Analytics** — графики и анализ
- 📊 **Charts** — TradingView Lightweight Charts

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 + TypeScript |
| State | Redux Toolkit + RTK Query |
| UI | HeroUI + TailwindCSS v4 |
| Forms | React Hook Form + Zod |
| Routing | React Router v7 |
| i18n | i18next (RU/EN) |
| Backend | Supabase (Auth, Postgres, RLS) |
| Build | Vite 7 |

## Getting Started

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev

# Build for production
npm run build
```

## Documentation

- [`docs/TECH_STACK.md`](docs/TECH_STACK.md) — библиотеки и версии
- [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md) — структура проекта
- [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) — схема БД
- [`docs/SCREENS_SPEC.md`](docs/SCREENS_SPEC.md) — спецификация экранов
- [`docs/RTK_QUERY_API.md`](docs/RTK_QUERY_API.md) — API reference
- [`docs/METATRADER_IMPORT.md`](docs/METATRADER_IMPORT.md) — импорт из MT4/MT5

## Project Status

🟡 **In Development** — MVP в разработке

---

*Built with ❤️ for traders*
