import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import PatientPortal from './pages/PatientPortal'
import DoctorPortal from './pages/DoctorPortal'
import Landing from './pages/Landing'

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  // If requiredRole is specified and doesn't match, redirect to correct portal
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'doctor' ? '/doctor' : '/portal'} replace />
  }
  return children
}

function AppRoutes() {
  const { user } = useAuth()

  const getDefaultRedirect = () => {
    if (!user) return <Landing />
    return <Navigate to={user.role === 'doctor' ? '/doctor' : '/portal'} replace />
  }

  return (
    <Routes>
      <Route path="/" element={getDefaultRedirect()} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'doctor' ? '/doctor' : '/portal'} replace /> : <Login />} />
      <Route
        path="/portal"
        element={
          <ProtectedRoute>
            <PatientPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor"
        element={
          <ProtectedRoute requiredRole="doctor">
            <DoctorPortal />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
