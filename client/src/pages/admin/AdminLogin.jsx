import { EyeIcon, EyeOffIcon, LockIcon, MailIcon, ShieldCheckIcon } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import adminApi from '../../configs/adminApi'
import { adminLogin } from '../../app/features/adminAuthSlice'
import toast from 'react-hot-toast'

const AdminLogin = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { admin } = useSelector((s) => s.adminAuth)

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // If already logged in as admin, redirect to dashboard
// Replace this useEffect in AdminLogin.jsx
useEffect(() => {
  const verifyAndRedirect = async () => {
    const storedToken = localStorage.getItem('adminToken')
    if (!storedToken) return

    // Token exists — verify it with backend
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/admin/me`, {
        headers: { Authorization: storedToken }
      })
      if (response.ok) {
        // Valid token — redirect away from login
        navigate('/admin/dashboard', { replace: true })
      } else {
        // Invalid token — clean it up
        localStorage.removeItem('adminToken')
      }
    } catch (error) {
      localStorage.removeItem('adminToken')
    }
  }

  verifyAndRedirect()
}, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
const handleSubmit = async (e) => {
  e.preventDefault()
  setIsLoading(true)

  try {
    const baseURL = import.meta.env.VITE_BASE_URL
    console.log('🔵 BASE URL:', baseURL)
    console.log('🔵 Form data:', formData)

    const response = await fetch(`${baseURL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    const data = await response.json()
    console.log('📦 Response status:', response.status)
    console.log('📦 Response data:', data)

    if (!response.ok) {
      toast.error(data.message || 'Login failed')
      return
    }

    localStorage.setItem('adminToken', data.token)
    dispatch(adminLogin({ token: data.token, admin: data.admin }))
    toast.success(`Welcome back, ${data.admin.name}!`)
    navigate('/admin/dashboard', { replace: true })

  } catch (error) {
    console.error('❌ Network error:', error)
    toast.error('Network error — check console')
  } finally {
    setIsLoading(false)
  }
}

  const inputCls =
    'flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none border-none ring-0'

  return (
    <div
      className="flex items-center justify-center min-h-screen font-sans relative overflow-hidden"
      style={{
        backgroundColor: '#F4F6F3',
        backgroundImage: `
          linear-gradient(rgba(16,185,129,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(16,185,129,0.05) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-[-100px] right-[-80px] size-[320px] rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
      <div className="absolute top-[80px] right-[80px] size-[140px] rounded-full bg-green-200/20 blur-2xl pointer-events-none" />
      <div className="absolute bottom-[-80px] left-[-60px] size-[300px] rounded-full bg-teal-200/25 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[160px] left-[80px] size-[100px] rounded-full bg-emerald-100/40 blur-xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm mx-4">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-12 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-200 mb-4">
            <ShieldCheckIcon className="size-5 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Admin Portal
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Sign in to access the admin dashboard
          </p>
        </div>

        {/* Card */}
        <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-100/80 overflow-hidden">
          <div className="h-[3px] w-full bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400" />

          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-emerald-50/50 pointer-events-none" />
          <div className="absolute -left-6 -bottom-6 size-24 rounded-full bg-slate-50/80 pointer-events-none" />

          <form onSubmit={handleSubmit} className="relative z-10 p-7 space-y-4">

            {/* Email */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
              <MailIcon className="size-4 text-slate-400 shrink-0" />
              <input
                type="email"
                name="email"
                placeholder="Admin email"
                className={inputCls}
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
              <LockIcon className="size-4 text-slate-400 shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                className={inputCls}
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-200 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="size-4" />
                  Sign In as Admin
                </>
              )}
            </button>

          </form>
        </div>

        {/* Security note */}
        <p className="text-center text-xs text-slate-400 mt-6">
          🔒 Restricted access — admins only
        </p>

      </div>
    </div>
  )
}

export default AdminLogin