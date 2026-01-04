# Trader Journal Electron App

Desktop версия Trader Journal для Windows и macOS.

## Возможности

- **Always on Top** (Ctrl/Cmd+T) — закрепить окно поверх других
- **Full Screen** (F11) — полноэкранный режим
- **Escape** — выход из полноэкранного режима

## Установка зависимостей

```bash
cd electron-app
npm install
```

## Запуск в режиме разработки

```bash
npm start
```

## Сборка

### Для текущей платформы
```bash
npm run build
```

### Для Windows
```bash
npm run build:win
```

### Для macOS
```bash
npm run build:mac
```

### Для обеих платформ
```bash
npm run build:all
```

Собранные файлы будут в папке `release/`.

## Иконки

Для сборки нужны иконки в папке `icons/`:
- `icon.png` — основная иконка (512x512 или больше)
- `icon.ico` — для Windows
- `icon.icns` — для macOS

Можно сгенерировать из PNG с помощью онлайн-конвертеров.
