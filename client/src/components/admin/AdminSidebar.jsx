import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  LayoutDashboardIcon,
  UsersIcon,
  FileTextIcon,
  BarChart2Icon,
  MessageSquareIcon,
  ShieldCheckIcon,
  LogOutIcon,
  XIcon,
  LayoutTemplateIcon,
  TargetIcon,
} from 'lucide-react'
import { adminLogout } from '../../app/features/adminAuthSlice'
import toast from 'react-hot-toast'

// Replace the links array with this
const links = [
  { to: '/admin/dashboard',  label: 'Dashboard',  icon: LayoutDashboardIcon },
  { to: '/admin/analytics',  label: 'Analytics',  icon: BarChart2Icon },
  { to: '/admin/users',      label: 'Users',       icon: UsersIcon },
  { to: '/admin/resumes',    label: 'Resumes',     icon: FileTextIcon },
  { to: '/admin/templates',  label: 'Templates',   icon: LayoutTemplateIcon }, // ← add this
  { to: '/admin/jd-match',   label: 'JDMatch',    icon: TargetIcon },
  { to: '/admin/feedback',   label: 'Feedback',    icon: MessageSquareIcon },
  
]

// Add LayoutTemplateIcon to imports from lucide-react

const AdminSidebar = ({ open, onClose }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { admin } = useSelector((s) => s.adminAuth)

  const handleLogout = () => {
    dispatch(adminLogout())
    toast.success('Logged out')
    navigate('/admin/login', { replace: true })
  }

  const navCls = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
        : 'text-slate-600 hover:bg-slate-100'
    }`

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-40 flex flex-col
        transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="size-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md shadow-emerald-200">
              <ShieldCheckIcon className="size-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800">Admin Panel</p>
              <p className="text-[10px] text-slate-400">Resume Builder</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600">
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={navCls} onClick={onClose}>
              <Icon className="size-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Admin info + logout */}
        <div className="px-4 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
              {admin?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">{admin?.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{admin?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 rounded-xl transition-colors font-medium"
          >
            <LogOutIcon className="size-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}

export default AdminSidebar