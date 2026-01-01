# Active Context

## Current Focus
[2026-01-01 11:49:00] - Уточнение требований и обновление документации
- UI Kit: HeroUI (ранее NextUI)
- Локализация: RU + EN с i18next
- MVP: Auth + Journal + MetaTrader Import
- News/Charts/Analytics — отложены на будущее

## Recent Changes
[2026-01-01 11:49:00] - Уточнены требования от пользователя
- Выбран HeroUI как UI библиотека
- Добавлена поддержка i18n (RU/EN)
- Уточнен MVP scope: только auth + journal + import
- News, charts, analytics перенесены в будущие релизы

[2026-01-01 11:23:00] - Проект инициализирован
- Создана структура memory-bank
- Собраны актуальные версии всех библиотек из ТЗ
- Подготовлена техническая документация

## Decisions Made ✅
1. **UI Kit** — HeroUI (v2.x, ранее NextUI) + TailwindCSS v4
2. **Локализация** — RU + EN через i18next
3. **News API** — ForexFactory API (FUTURE)
4. **Котировки** — Mock данные на старте (FUTURE)
5. **Supabase** — создать новый проект
6. **Git** — подключить к существующему пустому репозиторию

## Open Questions / Issues
1. **MetaTrader Import** — формат экспорта (CSV из MT4/MT5 History Center)
2. **Git remote URL** — нужен URL для подключения репозитория

## Session Notes
- Техническое задание получено и проанализировано
- Все основные библиотеки имеют актуальные стабильные версии
- React 19.2.x, RTK 2.11.x, Supabase 2.89.x — все production-ready

---
*Last updated: 2026-01-01*
