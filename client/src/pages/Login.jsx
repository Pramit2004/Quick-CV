import { EyeIcon, EyeOffIcon, LockIcon, MailIcon, User2Icon } from 'lucide-react'
import React, { useState } from 'react'
import api from '../configs/api'
import { useDispatch } from 'react-redux'
import { login } from '../app/features/authSlice'
import toast from 'react-hot-toast'

const Login = () => {
  const dispatch = useDispatch()
  const query = new URLSearchParams(window.location.search)
  const urlState = query.get('state')
  const [state, setState] = useState(urlState || 'login')
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({ name: '', email: '', password: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post(`/api/users/${state}`, formData)
      dispatch(login(data))
      localStorage.setItem('token', data.token)
      toast.success(data.message)
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toggleState = () => {
    setState(prev => prev === 'login' ? 'register' : 'login')
    setFormData({ name: '', email: '', password: '' })
    setShowPassword(false)
  }

  const inputCls = "flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none border-none ring-0"

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
      {/* ── Decorative blobs ── */}
      <div className="absolute top-[-100px] right-[-80px] size-[320px] rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
      <div className="absolute top-[80px] right-[80px] size-[140px] rounded-full bg-green-200/20 blur-2xl pointer-events-none" />
      <div className="absolute bottom-[-80px] left-[-60px] size-[300px] rounded-full bg-teal-200/25 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[160px] left-[80px] size-[100px] rounded-full bg-emerald-100/40 blur-xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[400px] rounded-full bg-green-50/30 blur-3xl pointer-events-none" />

      {/* ── Card ── */}
      <div className="relative z-10 w-full max-w-sm mx-4">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-12 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-200 mb-4">
            <LockIcon className="size-5 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {state === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {state === 'login' ? 'Sign in to your workspace' : 'Start building your resume today'}
          </p>
        </div>

        {/* Form Card */}
        <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-100/80 overflow-hidden">
          {/* Green top bar */}
          <div className="h-[3px] w-full bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400" />

          {/* Card inner decorations */}
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-emerald-50/50 pointer-events-none" />
          <div className="absolute -left-6 -bottom-6 size-24 rounded-full bg-slate-50/80 pointer-events-none" />

          <form onSubmit={handleSubmit} className="relative z-10 p-7 space-y-4">

            {/* Name — register only */}
            {state !== 'login' && (
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
                <User2Icon className="size-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  name="name"
                  placeholder="Full name"
                  className={inputCls}
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {/* Email */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
              <MailIcon className="size-4 text-slate-400 shrink-0" />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                className={inputCls}
                value={formData.email}
                onChange={handleChange}
                required
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
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>

            {/* Forgot password */}
            {state === 'login' && (
              <div className="flex justify-end">
                <button type="button" className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {state === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400 font-medium">or</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Toggle state */}
            <p className="text-center text-sm text-slate-500">
              {state === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={toggleState}
                className="text-emerald-600 font-bold hover:text-emerald-700 hover:underline transition-colors"
              >
                {state === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>

          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-6">
          By continuing, you agree to our{' '}
          <span className="text-emerald-600 font-medium cursor-pointer hover:underline">Terms</span>
          {' & '}
          <span className="text-emerald-600 font-medium cursor-pointer hover:underline">Privacy Policy</span>
        </p>

      </div>
    </div>
  )
}

export default Login