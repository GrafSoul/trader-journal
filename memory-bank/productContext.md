# Trader Journal - Product Context

## Overview
**Trader Journal** — приложение "Дневник Трейдера" для ведения и анализа сделок.

**Первый релиз:** Web-приложение на React  
**Будущее:** Порт в desktop через Electron без переписывания бизнес-логики

## Core Principles
- Подходит для любых рынков (Forex как базовый), сущности универсальные
- Фокус на простоте внесения сделок + аналитика/статистика
- Привязка к графику (в перспективе)
- Авторизация/регистрация обязательны

## Target Users
- Трейдеры любых рынков (Forex, Crypto, Stocks, Futures, Options)
- Начинающие и опытные трейдеры, ведущие журнал сделок

## Key Features (MVP)
1. **Auth + профиль** — регистрация/логин, базовые настройки
2. **CRUD сделок** — создание/редактирование/удаление/поиск с тегами и фильтрами
3. **Import из MetaTrader** — импорт истории сделок из MT4/MT5 (CSV/HTML)
4. **Dashboard** — базовая статистика (без графиков на старте)
5. **i18n** — поддержка RU и EN языков
6. **Electron-ready** — архитектура совместима с desktop

## Key Features (Future)
- **Новости** — ForexFactory API интеграция
- **Котировки** — подключение API котировок (mock на старте)
- **Расширенная аналитика** — графики equity curve, распределения
- **Визуализация сделок** — TradingView Lightweight Charts + аннотации

## Tech Stack Summary
- **Frontend:** React 19 + TypeScript + RTK + RTK Query
- **UI:** HeroUI (v2.x) + TailwindCSS v4
- **Forms:** React Hook Form + Zod
- **Routing:** React Router v7
- **i18n:** i18next + react-i18next (RU/EN)
- **Charts:** Recharts / TradingView Lightweight Charts (future)
- **Backend:** Supabase (Auth, Postgres, RLS, Storage)
- **Desktop:** Electron (future)
- **Build:** Vite 7

## Project Structure
```
trader-journal/
├── src/
│   ├── app/              # App entry, providers, routes
│   ├── components/       # UI components (presentational)
│   ├── features/         # Feature modules (логика экранов)
│   ├── services/         # RTK Query API services
│   ├── store/            # Redux store, slices
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utilities, helpers
│   ├── types/            # TypeScript types/interfaces
│   └── lib/              # External lib configs (supabase, etc)
├── public/
├── docs/
├── memory-bank/
└── ...config files
```

---
*Last updated: 2026-01-01*
