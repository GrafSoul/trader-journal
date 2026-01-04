# 🚀 Redux Integration Guide - Sofeeya Project

**Полная инструкция по интеграции данных: Supabase → Redux → Components**

---

## 🎯 Архитектурный Принцип

### 🔥 **ЗОЛОТОЕ ПРАВИЛО RTK АРХИТЕКТУРЫ**
```
Database (Supabase) → Service (createAsyncThunk) → Slice (Redux) → Component (useAppSelector)
```

**ЗАПРЕЩЕНО** пропускать любой этап этой цепочки!
**ЗАПРЕЩЕНО** вызывать сервисы напрямую из компонентов!
**ЗАПРЕЩЕНО** использовать любые другие паттерны!

---

## 📁 Структура Файлов

### **1. Типы данных** - `src/types/`
```
src/types/
├── index.ts           # Общие типы
├── user.ts           # Типы пользователей  
├── telegram.ts       # Типы Telegram API
├── learning.ts       # Типы обучения
└── [feature].ts      # Типы для каждой фичи
```

### **2. Сервисы** - `src/services/`
```
src/services/
├── userService.ts       # ТОЛЬКО createAsyncThunk методы
├── telegramService.ts   # ТОЛЬКО createAsyncThunk методы
├── learningService.ts   # ТОЛЬКО createAsyncThunk методы
└── [feature]Service.ts  # ТОЛЬКО createAsyncThunk методы
```

### **3. Redux Store** - `src/store/`
```
src/store/
├── index.ts                    # Конфигурация store
├── hooks.ts                    # Типизированные hooks
├── constants/
│   └── actionTypes.ts          # Константы для thunk actions
├── statuses/
│   └── statuses.ts            # Статусы загрузки данных
└── slices/
    ├── userSlice.ts           # Slice для пользователей
    ├── telegramSlice.ts       # Slice для Telegram
    ├── learningSlice.ts       # Slice для обучения
    └── [feature]Slice.ts      # Slice для каждой фичи
```

---

## 🛠️ Пошаговое Создание Интеграции

### **ШАГ 1: Создание Типов**

#### **1.1 Файл типов** - `src/types/[feature].ts`
```typescript
// ==================== [FEATURE] TYPES ====================

// Import database types from Supabase
import type { DatabaseTable } from "../lib/supabase";
export type { DatabaseTable };

// Service parameter types
export interface CreateItemParams {
  telegram_id: number;
  name: string;
  // ... other fields
}

export interface UpdateItemParams {
  id: string;
  telegram_id: number;
  // ... fields to update
}

// Component props types
export interface ItemListProps {
  className?: string;
}

export interface ItemCardProps {
  item: DatabaseTable;
  onSelect: (id: string) => void;
}

// Redux state type
export interface FeatureState {
  items: DatabaseTable[];
  currentItem: DatabaseTable | null;
  error: string | null;
  status: import("../store/statuses/statuses").StatusType;
}
```

#### **1.2 Экспорт в** - `src/types/index.ts`
```typescript
// Feature exports
export * from './feature';
```

---

### **ШАГ 2: Создание Констант**

#### **2.1 Action Types** - `src/store/constants/actionTypes.ts`
```typescript
// ==================== [FEATURE] ACTIONS ====================
export const FEATURE_FETCH_ITEMS = 'feature/fetchItems';
export const FEATURE_CREATE_ITEM = 'feature/createItem';
export const FEATURE_UPDATE_ITEM = 'feature/updateItem';
export const FEATURE_DELETE_ITEM = 'feature/deleteItem';
```

#### **2.2 Статусы** - `src/store/statuses/statuses.ts`
```typescript
// ==================== STATUS TYPES ====================
export const Statuses = {
  IDLE: 'idle',
  LOADING: 'loading', 
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
} as const;

export type StatusType = typeof Statuses[keyof typeof Statuses];
```

---

### **ШАГ 3: Создание Service**

#### **3.1 Service файл** - `src/services/[feature]Service.ts`
```typescript
import { createAsyncThunk } from "@reduxjs/toolkit";
import { supabase, setCurrentUser } from "../lib/supabase";
import type { DatabaseTable, CreateItemParams, UpdateItemParams } from "../types/[feature]";
import * as types from "../store/constants/actionTypes";

// ==================== ASYNC THUNKS ====================

export const fetchItems = createAsyncThunk<DatabaseTable[], void>(
  types.FEATURE_FETCH_ITEMS,
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('table_name')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('❌ Error fetching items:', error);
        throw new Error(`Failed to fetch items: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.warn('❌ fetchItems failed:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const createItem = createAsyncThunk<DatabaseTable, CreateItemParams>(
  types.FEATURE_CREATE_ITEM,
  async (params, { rejectWithValue }) => {
    try {
      // Set current user for RLS
      await setCurrentUser(params.telegram_id);
      
      const { data, error } = await supabase
        .from('table_name')
        .insert([params])
        .select()
        .single();

      if (error) {
        console.warn('❌ Error creating item:', error);
        throw new Error(`Failed to create item: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.warn('❌ createItem failed:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const updateItem = createAsyncThunk<DatabaseTable, UpdateItemParams>(
  types.FEATURE_UPDATE_ITEM,
  async (params, { rejectWithValue }) => {
    try {
      await setCurrentUser(params.telegram_id);
      
      const { data, error } = await supabase
        .from('table_name')
        .update(params)
        .eq('id', params.id)
        .select()
        .single();

      if (error) {
        console.warn('❌ Error updating item:', error);
        throw new Error(`Failed to update item: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.warn('❌ updateItem failed:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);
```

---

### **ШАГ 4: Создание Redux Slice**

#### **4.1 Slice файл** - `src/store/slices/[feature]Slice.ts`
```typescript
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { fetchItems, createItem, updateItem } from "../../services/[feature]Service";
import type { FeatureState, DatabaseTable } from "../../types/[feature]";
import { Statuses } from "../statuses/statuses";

// ==================== INITIAL STATE ====================

const initialState: FeatureState = {
  items: [],
  currentItem: null,
  error: null,
  status: Statuses.IDLE,
};

// ==================== SLICE ====================

const featureSlice = createSlice({
  name: "feature",
  initialState,
  reducers: {
    // Clear data
    clearFeatureData: (state) => {
      state.items = [];
      state.currentItem = null;
      state.error = null;
      state.status = Statuses.IDLE;
    },
    
    // Clear errors
    clearFeatureError: (state) => {
      state.error = null;
    },
    
    // Set current item
    setCurrentItem: (state, action: PayloadAction<DatabaseTable | null>) => {
      state.currentItem = action.payload;
    },
  },
  extraReducers: (builder) => {
    // ==================== FETCH ITEMS ====================
    builder
      .addCase(fetchItems.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action: PayloadAction<DatabaseTable[]>) => {
        state.status = Statuses.SUCCEEDED;
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = action.payload as string || 'Failed to fetch items';
      })
      
    // ==================== CREATE ITEM ====================
      .addCase(createItem.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(createItem.fulfilled, (state, action: PayloadAction<DatabaseTable>) => {
        state.status = Statuses.SUCCEEDED;
        state.items.unshift(action.payload); // Add to beginning
        state.error = null;
      })
      .addCase(createItem.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = action.payload as string || 'Failed to create item';
      })
      
    // ==================== UPDATE ITEM ====================
      .addCase(updateItem.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(updateItem.fulfilled, (state, action: PayloadAction<DatabaseTable>) => {
        state.status = Statuses.SUCCEEDED;
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentItem?.id === action.payload.id) {
          state.currentItem = action.payload;
        }
        state.error = null;
      })
      .addCase(updateItem.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = action.payload as string || 'Failed to update item';
      });
  },
});

// ==================== EXPORTS ====================

export const { 
  clearFeatureData, 
  clearFeatureError,
  setCurrentItem
} = featureSlice.actions;

export default featureSlice.reducer;
```

#### **4.2 Подключение в Store** - `src/store/index.ts`
```typescript
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import telegramReducer from "./slices/telegramSlice";
import learningReducer from "./slices/learningSlice";
import featureReducer from "./slices/featureSlice"; // ✅ Добавить

export const store = configureStore({
  reducer: {
    user: userReducer,
    telegram: telegramReducer,
    learning: learningReducer,
    feature: featureReducer, // ✅ Добавить
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

---

### **ШАГ 5: Интеграция в Компонент**

#### **5.1 Component файл** - `src/pages/[Feature]Page/[Feature]Page.tsx`
```typescript
import React, { useEffect } from 'react';
import { Box, VStack, Spinner, Text, Button } from '@chakra-ui/react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchItems, createItem } from '../../services/[feature]Service';
import { clearFeatureError } from '../../store/slices/featureSlice';
import { Statuses } from '../../store/statuses/statuses';
import type { CreateItemParams } from '../../types/[feature]';
import styles from './FeaturePage.module.css';

export const FeaturePage: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // ==================== REDUX STATE ====================
  const { items, currentItem, error, status } = useAppSelector((state) => state.feature);
  const { user } = useAppSelector((state) => state.user);

  // ==================== DATA LOADING ====================
  useEffect(() => {
    if (user?.telegram_id) {
      dispatch(fetchItems());
    }
  }, [dispatch, user?.telegram_id]);

  // ==================== HANDLERS ====================
  const handleCreateItem = async (params: Omit<CreateItemParams, 'telegram_id'>) => {
    if (!user?.telegram_id) return;
    
    dispatch(createItem({
      telegram_id: user.telegram_id,
      ...params
    }));
  };

  const handleRetry = () => {
    dispatch(clearFeatureError());
    dispatch(fetchItems());
  };

  // ==================== LOADING STATE ====================
  if (status === Statuses.LOADING && items.length === 0) {
    return (
      <div className={styles.container}>
        <VStack gap={4} align="center" justify="center" minH="200px">
          <Spinner size="lg" color="pink.500" borderWidth="3px" />
          <Text color="gray.600">Загружаем данные...</Text>
        </VStack>
      </div>
    );
  }

  // ==================== ERROR STATE ====================
  if (status === Statuses.FAILED && error) {
    return (
      <div className={styles.container}>
        <VStack gap={4} align="center" justify="center" minH="200px">
          <Text color="red.500" textAlign="center">
            Ошибка загрузки: {error}
          </Text>
          <Button 
            onClick={handleRetry}
            colorScheme="pink"
            size="sm"
          >
            Повторить
          </Button>
        </VStack>
      </div>
    );
  }

  // ==================== SUCCESS STATE ====================
  return (
    <div className={styles.container}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Box>
          <Text fontSize="lg" fontWeight="600">
            Список элементов ({items.length})
          </Text>
        </Box>

        {/* Items List */}
        <VStack gap={4} align="stretch">
          {items.map((item) => (
            <Box 
              key={item.id}
              p={4}
              bg="gray.50"
              borderRadius="md"
              border="1px solid"
              borderColor="gray.200"
              _dark={{ bg: "gray.800", borderColor: "gray.700" }}
            >
              <Text fontWeight="600">{item.name}</Text>
              {/* Render item content */}
            </Box>
          ))}
        </VStack>

        {/* Empty State */}
        {items.length === 0 && status === Statuses.SUCCEEDED && (
          <Box textAlign="center" py={8}>
            <Text color="gray.500">
              Пока нет данных
            </Text>
          </Box>
        )}
      </VStack>
    </div>
  );
};
```

#### **5.2 CSS Module** - `src/pages/[Feature]Page/[Feature]Page.module.css`
```css
.container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .container {
    padding: 16px;
  }
}
```

---

## 🎯 Правильные Паттерны

### **✅ DO - Правильные Подходы**

#### **1. Статусы вместо Boolean флагов**
```typescript
// ✅ ПРАВИЛЬНО - единый статус
interface State {
  status: StatusType;
  error: string | null;
  data: Item[];
}

// ❌ НЕПРАВИЛЬНО - множественные флаги
interface State {
  isLoading: boolean;
  isLoadingItems: boolean;
  isUpdating: boolean;
  hasError: boolean;
}
```

#### **2. Типы в отдельных файлах**
```typescript
// ✅ ПРАВИЛЬНО - импорт типов
import type { UserData, CreateUserParams } from "../types/user";

// ❌ НЕПРАВИЛЬНО - типы в сервисе
interface UserData {
  // ... определение прямо в сервисе
}
```

#### **3. Только createAsyncThunk в сервисах**
```typescript
// ✅ ПРАВИЛЬНО - только thunk методы
export const fetchUsers = createAsyncThunk<User[], void>(
  types.USER_FETCH,
  async (_, { rejectWithValue }) => {
    // логика здесь
  }
);

// ❌ НЕПРАВИЛЬНО - вспомогательные функции
export const getUserById = (id: string) => {
  // отдельная функция - НЕ НУЖНА!
};
```

#### **4. Константы для action types**
```typescript
// ✅ ПРАВИЛЬНО - константы из файла
import * as types from "../store/constants/actionTypes";
export const fetchData = createAsyncThunk(types.FETCH_DATA, ...);

// ❌ НЕПРАВИЛЬНО - строки напрямую
export const fetchData = createAsyncThunk('feature/fetchData', ...);
```

#### **5. RLS для Supabase**
```typescript
// ✅ ПРАВИЛЬНО - всегда устанавливать пользователя
await setCurrentUser(params.telegram_id);
const { data, error } = await supabase.from('table')...

// ❌ НЕПРАВИЛЬНО - запросы без RLS
const { data, error } = await supabase.from('table')...
```

---

### **❌ DON'T - Антипаттерны**

#### **1. НЕ смешивать статусы и boolean флаги**
```typescript
// ❌ НЕПРАВИЛЬНО
interface State {
  status: StatusType;
  isLoading: boolean; // Дублирование!
  isError: boolean;   // Дублирование!
}
```

#### **2. НЕ вызывать сервисы напрямую из компонентов**
```typescript
// ❌ НЕПРАВИЛЬНО
import { fetchDataFromAPI } from '../services/api';

const Component = () => {
  useEffect(() => {
    fetchDataFromAPI(); // Нарушение архитектуры!
  }, []);
};
```

#### **3. НЕ использовать mock данные с Redux**
```typescript
// ❌ НЕПРАВИЛЬНО
import { mockData } from '../mock-data/items';
const { items } = useAppSelector(state => state.feature);
const finalData = items.length > 0 ? items : mockData; // Смешивание!
```

#### **4. НЕ создавать сложные селекторы**
```typescript
// ❌ НЕПРАВИЛЬНО - избыточная сложность
export const selectFilteredItems = createSelector(
  state => state.items,
  state => state.filters,
  (items, filters) => items.filter(item => filters.includes(item.type))
);

// ✅ ПРАВИЛЬНО - простое получение данных
const { items } = useAppSelector(state => state.feature);
const filteredItems = items.filter(item => conditions);
```

---

## 🚀 Workflow для Новой Фичи

### **1. Планирование (5 мин)**
- [ ] Определить название фичи
- [ ] Определить типы данных из Supabase
- [ ] Определить необходимые CRUD операции

### **2. Создание типов (10 мин)**
- [ ] Создать `src/types/[feature].ts`
- [ ] Определить все интерфейсы
- [ ] Экспортировать в `src/types/index.ts`

### **3. Создание констант (5 мин)**
- [ ] Добавить action types в `actionTypes.ts`
- [ ] Проверить что статусы подключены

### **4. Создание сервиса (20 мин)**
- [ ] Создать `src/services/[feature]Service.ts`
- [ ] Реализовать все нужные createAsyncThunk методы
- [ ] Добавить обработку ошибок
- [ ] Добавить RLS для Supabase

### **5. Создание slice (15 мин)**
- [ ] Создать `src/store/slices/[feature]Slice.ts`
- [ ] Добавить initialState
- [ ] Добавить reducers для управления состоянием
- [ ] Добавить extraReducers для thunk-ов
- [ ] Подключить в store

### **6. Интеграция в компонент (20 мин)**
- [ ] Создать компонент с Redux hooks
- [ ] Добавить useEffect для загрузки данных
- [ ] Добавить обработку всех статусов
- [ ] Добавить error handling
- [ ] Протестировать функциональность

### **7. Тестирование (10 мин)**
- [ ] Проверить `npm run build`
- [ ] Проверить что нет ошибок TypeScript
- [ ] Проверить что нет неиспользуемых импортов
- [ ] Протестировать в браузере

**Общее время: ~85 минут на полную интеграцию фичи**

---

## 📚 Референсы

### **Успешные примеры в проекте:**
- ✅ `learningSlice.ts` - идеальная реализация
- ✅ `learningService.ts` - правильная структура 
- ✅ `LearningPage.tsx` - корректная интеграция
- ✅ `types/learning.ts` - полная типизация

### **Файлы для изучения:**
```
src/store/slices/learningSlice.ts     # Образец slice
src/services/learningService.ts       # Образец service
src/pages/LearningPage/LearningPage.tsx  # Образец component
src/types/learning.ts                 # Образец types
```

---

## 🎯 Заключение

**Следуя этой инструкции, вы гарантированно получите:**
- 🔥 Правильную RTK архитектуру
- 🔥 Чистый и поддерживаемый код
- 🔥 100% типизацию TypeScript
- 🔥 Корректную интеграцию с Supabase
- 🔥 Отсутствие архитектурных проблем

**Помните главный принцип:**
```
Database → Service → Slice → Component
```

**НЕ НАРУШАЙТЕ ЭТУ ЦЕПОЧКУ!** 