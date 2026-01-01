# Tech Stack Documentation

## Library Versions (актуально на январь 2026)

### Core Framework
| Package | Version | Notes |
|---------|---------|-------|
| react | ^19.2.3 | Latest stable |
| react-dom | ^19.2.3 | Latest stable |
| typescript | ^5.7.x | TS 5.4+ required for RTK |

### State Management
| Package | Version | Notes |
|---------|---------|-------|
| @reduxjs/toolkit | ^2.11.2 | Includes RTK Query |
| react-redux | ^9.x | React 19 compatible |

### Routing
| Package | Version | Notes |
|---------|---------|-------|
| react-router | ^7.11.x | Latest v7 with data APIs |
| react-router-dom | ^7.11.x | DOM bindings |

### UI Library (HeroUI)
| Package | Version | Notes |
|---------|---------|-------|
| @heroui/react | ^2.x | Полный UI kit (ранее NextUI) |
| tailwindcss | ^4.1.18 | New v4 config syntax |
| @tailwindcss/vite | ^4.1.x | Vite plugin |
| framer-motion | ^11.x | Анимации (зависимость HeroUI) |

### HeroUI Setup
HeroUI — полноценная UI библиотека на базе React Aria + Tailwind CSS.
```bash
npm install @heroui/react framer-motion
```

### Forms & Validation
| Package | Version | Notes |
|---------|---------|-------|
| react-hook-form | ^7.x | Form state management |
| @hookform/resolvers | ^3.x | Zod resolver |
| zod | ^3.x | Schema validation |

### Charts
| Package | Version | Notes |
|---------|---------|-------|
| recharts | ^3.6.0 | For statistics/analytics |
| lightweight-charts | ^5.1.0 | TradingView charts for trading |

### Backend (Supabase)
| Package | Version | Notes |
|---------|---------|-------|
| @supabase/supabase-js | ^2.89.0 | Supabase client |
| @supabase/auth-helpers-react | ^0.5.x | React auth helpers |

### Build Tools
| Package | Version | Notes |
|---------|---------|-------|
| vite | ^7.x | Build tool |
| @vitejs/plugin-react | ^5.x | React plugin |

### Desktop (Future)
| Package | Version | Notes |
|---------|---------|-------|
| electron | ^39.2.x | Desktop wrapper |
| electron-builder | ^25.x | Build/package |

### Internationalization (i18n)
| Package | Version | Notes |
|---------|---------|-------|
| i18next | ^24.x | i18n core |
| react-i18next | ^15.x | React bindings |
| i18next-browser-languagedetector | ^8.x | Auto language detection |

### Testing
| Package | Version | Notes |
|---------|---------|-------|
| vitest | ^3.x | Unit testing |
| @testing-library/react | ^16.x | React testing |
| playwright | ^1.49.x | E2E testing |

---

## Installation Commands

### Initial Setup
```bash
# Create Vite project
npm create vite@latest trader-journal -- --template react-ts

# Core dependencies
npm install @reduxjs/toolkit react-redux react-router-dom @supabase/supabase-js

# UI (HeroUI)
npm install @heroui/react framer-motion
npm install -D tailwindcss @tailwindcss/vite

# Forms
npm install react-hook-form @hookform/resolvers zod

# i18n
npm install i18next react-i18next i18next-browser-languagedetector

# Charts (FUTURE - не устанавливать сейчас)
# npm install recharts lightweight-charts

# Dev dependencies
npm install -D vitest @testing-library/react playwright
```

### HeroUI + TailwindCSS v4 Setup
```css
/* src/index.css */
@import "tailwindcss";
```

```typescript
// tailwind.config.ts
import { heroui } from "@heroui/react";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  plugins: [heroui()],
};
```

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

```tsx
// src/main.tsx
import { HeroUIProvider } from "@heroui/react";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <HeroUIProvider>
    <App />
  </HeroUIProvider>
);
```

### i18n Setup
```typescript
// src/lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ru from '@/locales/ru/translation.json';
import en from '@/locales/en/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      en: { translation: en },
    },
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

---

## Key Configuration Notes

### Vite Config for Electron Compatibility
```typescript
// vite.config.ts
export default defineConfig({
  base: './', // Важно для Electron
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### TypeScript Paths
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Supabase Environment Variables
```bash
# .env.local
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---
*Last updated: 2026-01-01*
