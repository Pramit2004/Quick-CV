import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../app/features/authSlice'
import adminAuthReducer from '../app/features/adminAuthSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminAuth: adminAuthReducer,
  },
})