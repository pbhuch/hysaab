import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import settingsReducer from './settingsSlice';
import milkReducer from './milkSlice';
import laundryReducer from './laundrySlice';
import maidReducer from './maidSlice';

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    milk: milkReducer,
    laundry: laundryReducer,
    maid: maidReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
