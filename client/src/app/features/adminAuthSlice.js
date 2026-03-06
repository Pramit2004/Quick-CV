import { createSlice } from '@reduxjs/toolkit'

const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState: {
    token: null,
    admin: null,
    loading: true,
  },
  reducers: {
    adminLogin: (state, action) => {
      state.token = action.payload.token
      state.admin = action.payload.admin
      state.loading = false
    },
    adminLogout: (state) => {
      state.token = null
      state.admin = null
      state.loading = false
      localStorage.removeItem('adminToken')
    },
    setAdminLoading: (state, action) => {
      state.loading = action.payload
    },
  },
})

export const { adminLogin, adminLogout, setAdminLoading } = adminAuthSlice.actions
export default adminAuthSlice.reducer