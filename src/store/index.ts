import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tradeReducer from './slices/tradeSlice';
import statsReducer from './slices/statsSlice';
import profileReducer from './slices/profileSlice';
import newsReducer from './slices/newsSlice';
import calendarReducer from './slices/calendarSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    trades: tradeReducer,
    stats: statsReducer,
    profile: profileReducer,
    news: newsReducer,
    calendar: calendarReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        warnAfter: 256,
        ignoredActions: ['auth/setAuth'],
        ignoredActionPaths: ['payload.session', 'payload.user'],
        ignoredPaths: ['auth.session', 'auth.user'],
      },
      immutableCheck: {
        warnAfter: 256,
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
