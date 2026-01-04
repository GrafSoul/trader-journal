import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tradeReducer from './slices/tradeSlice';
import statsReducer from './slices/statsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    trades: tradeReducer,
    stats: statsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
