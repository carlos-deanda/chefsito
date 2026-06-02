import { useState } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import AdminDashboard from './dashboards/AdminDashboard.jsx'
import UsuarioDashboard from './dashboards/UsuarioDashboard.jsx'
import StaffWaitlistDashboard from './dashboards/StaffWaitlistDashboard.jsx'
import GerenteDashboard from './dashboards/GerenteDashboard.jsx'
import SoporteDashboard from './dashboards/SoporteDashboard.jsx'

function RoleDashboard({ user, onLogout }) {
  switch (user.role) {
    case 'admin':
      return <AdminDashboard onLogout={onLogout} user={user} />
    case 'usuario':
      return <UsuarioDashboard onLogout={onLogout} user={user} />
    case 'recepcionista':
      return <StaffWaitlistDashboard onLogout={onLogout} roleTitle="Recepcionista" user={user} />
    case 'gerente':
      return <GerenteDashboard onLogout={onLogout} user={user} />
    case 'soporte':
      return <SoporteDashboard onLogout={onLogout} user={user} />
    default:
      return (
        <main className="flex min-h-screen items-center justify-center p-6">
          <p className="text-zinc-600">Rol desconocido: {user.role}</p>
        </main>
      )
  }
}

export default function App() {
  const { user, loading, logout, isAuthenticated } = useAuth()
  const [authView, setAuthView] = useState('login')

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100">
        <p className="text-sm text-zinc-500">Cargando…</p>
      </main>
    )
  }

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterPage onGoLogin={() => setAuthView('login')} />
    }
    return <LoginPage onGoRegister={() => setAuthView('register')} />
  }

  return <RoleDashboard onLogout={logout} user={user} />
}
