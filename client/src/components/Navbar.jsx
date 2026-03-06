import React, { useState, useRef, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../app/features/authSlice'
import {
  LogOutIcon,
  UserIcon,
  SettingsIcon,
  ChevronDownIcon,
  LayoutDashboardIcon,
  CreditCardIcon,
} from 'lucide-react'

const Navbar = () => {
  const { user } = useSelector(state => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const logoutUser = () => {
    setIsOpen(false)
    dispatch(logout())
    navigate('/')
  }

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboardIcon, path: '/app' },
    { label: 'My Profile',  icon: UserIcon,            path: '/app/profile' },
    { label: 'Settings',    icon: SettingsIcon,         path: '/app/settings' },
  ]

  return (
    <div className='sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-slate-200 shadow-[0_1px_8px_rgba(0,0,0,0.04)]'>
      <nav className='flex items-center justify-between max-w-6xl mx-auto px-5 sm:px-8 h-16'>

        {/* Logo */}
        <Link to='/' className='flex items-center gap-2 group'>
          <img src='/logo.svg' alt='logo' className='h-8 w-auto group-hover:opacity-80 transition-opacity' />
        </Link>

        {/* Avatar + Dropdown */}
        <div className='relative' ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1.5 p-1 rounded-xl border transition-all duration-200 ${
              isOpen
                ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                : 'border-slate-200 hover:border-emerald-200 hover:bg-slate-50'
            }`}
          >
            {/* Avatar */}
            <div className='size-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-emerald-200 overflow-hidden'>
              {user?.avatar
                ? <img src={user.avatar} alt='avatar' className='w-full h-full object-cover' />
                : getInitials(user?.name)
              }
            </div>

            <ChevronDownIcon className={`size-4 text-slate-400 mr-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className='absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 ring-1 ring-black/5 overflow-hidden origin-top-right'>

              {/* Green top bar */}
              <div className='h-[3px] w-full bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400' />

              {/* User header */}
              <div className='px-4 py-3.5 border-b border-slate-100 bg-slate-50/50'>
                <div className='flex items-center gap-3'>
                  <div className='size-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-emerald-100 overflow-hidden shrink-0'>
                    {user?.avatar
                      ? <img src={user.avatar} alt='avatar' className='w-full h-full object-cover' />
                      : getInitials(user?.name)
                    }
                  </div>
                  <div className='min-w-0'>
                    <p className='text-sm font-bold text-slate-800 truncate'>{user?.name || 'User'}</p>
                    <p className='text-xs text-slate-400 truncate'>{user?.email || ''}</p>
                  </div>
                </div>
              </div>

              {/* Nav items */}
              <div className='p-2 space-y-0.5'>
                {navItems.map(({ label, icon: Icon, path }) => (
                  <button
                    key={path}
                    onClick={() => { navigate(path); setIsOpen(false) }}
                    className='w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-colors group'
                  >
                    <span className='size-7 rounded-lg bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors'>
                      <Icon className='size-3.5 text-slate-500 group-hover:text-emerald-600 transition-colors' />
                    </span>
                    {label}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className='h-px bg-slate-100 mx-3' />

              {/* Logout */}
              <div className='p-2'>
                <button
                  onClick={logoutUser}
                  className='w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors group'
                >
                  <span className='size-7 rounded-lg bg-slate-100 group-hover:bg-red-100 flex items-center justify-center transition-colors'>
                    <LogOutIcon className='size-3.5 text-slate-500 group-hover:text-red-500 transition-colors' />
                  </span>
                  Sign Out
                </button>
              </div>

            </div>
          )}
        </div>

      </nav>
    </div>
  )
}

export default Navbar