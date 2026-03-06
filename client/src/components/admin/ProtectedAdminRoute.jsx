import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import adminApi from '../../configs/adminApi'
import { adminLogin, adminLogout, setAdminLoading } from '../../app/features/adminAuthSlice'

const ProtectedAdminRoute = ({ children }) => {
  const dispatch = useDispatch()
  const { admin, loading } = useSelector((s) => s.adminAuth)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem('adminToken')

      if (!token) {
        dispatch(setAdminLoading(false))
        setVerified(true)
        return
      }

      if (admin) {
        dispatch(setAdminLoading(false))
        setVerified(true)
        return
      }

      try {
        const { data } = await adminApi.get('/api/admin/me')
        dispatch(adminLogin({ token, admin: data.admin }))
      } catch {
        dispatch(adminLogout())
      } finally {
        setVerified(true)
      }
    }

    verify()
  }, [])

  if (!verified || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  const token = localStorage.getItem('adminToken')
  if (!token || !admin) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

export default ProtectedAdminRoute