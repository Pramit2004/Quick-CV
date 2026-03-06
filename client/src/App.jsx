import React, { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Layout from './pages/Layout'
import Dashboard from './pages/Dashboard'
import ResumeBuilder from './pages/ResumeBuilder'
import Preview from './pages/Preview'
import Login from './pages/Login'
import { useDispatch } from 'react-redux'
import api from './configs/api'
import { login, setLoading, logout } from './app/features/authSlice'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import JDMatch from './pages/JDMatch'
import Profile from './pages/Profile'
import Settings from './pages/Settings'

// Admin imports
import AdminLogin          from './pages/admin/AdminLogin'
import AdminLayout         from './pages/admin/AdminLayout'
import AdminDashboard      from './pages/admin/AdminDashboard'
import AdminAnalytics      from './pages/admin/AdminAnalytics'
import AdminUsers          from './pages/admin/AdminUsers'
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute'
import TemplateGallery     from './pages/TemplateGallery'
import AdminTemplates      from './pages/admin/AdminTemplates'
import AdminResumes        from './pages/admin/AdminResumes'
import AdminFeedback       from './pages/admin/AdminFeedback'
import AdminTemplateBuilder from './pages/admin/AdminTemplateBuilder'
import AdminJDMatch        from './pages/admin/Adminjdmatch'

// ── Module 5 ──────────────────────────────────────────────────
import TemplateStudio from './pages/TemplateStudio'

const App = () => {
  const dispatch = useDispatch()

  const getUserData = async () => {
    const token = localStorage.getItem('token')
    try {
      if (token) {
        const { data } = await api.get('/api/users/data', {
          headers: { Authorization: token },
        })
        if (data.user) {
          dispatch(login({ token, user: data.user }))
        }
        dispatch(setLoading(false))
      } else {
        dispatch(setLoading(false))
      }
    } catch (error) {
      dispatch(setLoading(false))

      if (error?.response?.status === 403) {
        dispatch(logout())
        localStorage.removeItem('token')
        toast.error(
          error?.response?.data?.message ||
          'Your account has been suspended. Please contact support.'
        )
      } else if (error?.response?.status === 401) {
        dispatch(logout())
        localStorage.removeItem('token')
      }

      console.log(error.message)
    }
  }

  useEffect(() => { getUserData() }, [])

  return (
    <>
      <Toaster />
      <Routes>

        {/* ── Public user routes ──────────────────────────────── */}
        <Route path="/"      element={<Home />}  />
        <Route path="/login" element={<Login />} />

        {/* ── Protected user routes ───────────────────────────── */}
        <Route path="app" element={<Layout />}>
          <Route index                                   element={<Dashboard />}      />
          <Route path="builder/:resumeId"                element={<ResumeBuilder />}  />
          <Route path="jd-match"                         element={<JDMatch />}        />
          <Route path="profile"                          element={<Profile />}        />
          <Route path="settings"                         element={<Settings />}       />
          <Route path="templates"                        element={<TemplateGallery />}/>
          {/* Module 5 — Template Studio */}
          <Route path="template-studio/:resumeId"        element={<TemplateStudio />} />
        </Route>

        {/* ── Resume preview ──────────────────────────────────── */}
        <Route path="view/:resumeId" element={<Preview />} />

        {/* ── Admin login (public) ────────────────────────────── */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ── Admin protected routes ──────────────────────────── */}
        <Route
          path="/admin"
          element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }
        >
          <Route path="dashboard"          element={<AdminDashboard />}      />
          <Route path="analytics"          element={<AdminAnalytics />}      />
          <Route path="users"              element={<AdminUsers />}          />
          <Route path="resumes"            element={<AdminResumes />}        />
          <Route path="jd-match"           element={<AdminJDMatch />}        />
          <Route path="feedback"           element={<AdminFeedback />}       />
          <Route path="templates"          element={<AdminTemplates />}      />
          <Route path="templates/new"      element={<AdminTemplateBuilder />}/>
          <Route path="templates/:id/edit" element={<AdminTemplateBuilder />}/>
        </Route>

      </Routes>
    </>
  )
}

export default App