import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import AdminLayout from '../components/admin/AdminLayout.jsx'
import AdminAnalyticsPage from '../components/admin/views/AdminAnalyticsPage.jsx'
import AdminDashboardHome from '../components/admin/views/AdminDashboardHome.jsx'
import AdminRestaurantesPage from '../components/admin/views/AdminRestaurantesPage.jsx'
import AdminStaffPage from '../components/admin/views/AdminStaffPage.jsx'
import AdminPublicacionesPage from '../components/admin/views/AdminPublicacionesPage.jsx'
import AdminAcademicPage from '../components/admin/views/AdminAcademicPage.jsx'

export default function AdminDashboard({ user, onLogout }) {
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [restaurantStats, setRestaurantStats] = useState([])
  const [error, setError] = useState('')
  const [activeSection, setActiveSection] = useState('dashboard')

  const load = useCallback(async () => {
    try {
      const [ov, us, rs] = await Promise.all([
        api('/admin/overview'),
        api('/admin/users'),
        api('/admin/restaurants'),
      ])
      setOverview(ov)
      setUsers(us.users)
      setRestaurants(rs.restaurants)
      setError('')

      const stats = await Promise.all(
        rs.restaurants.map(async (restaurant) => {
          try {
            const [daily, hourlyRes] = await Promise.all([
              api(`/analytics/${restaurant.id}/daily`),
              api(`/analytics/${restaurant.id}/hourly`).catch(() => ({ hours: [] })),
            ])
            return { restaurant, stats: daily, hourly: hourlyRes.hours ?? [] }
          } catch {
            return { restaurant, stats: null, hourly: [] }
          }
        }),
      )
      setRestaurantStats(stats)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const managers = users.filter((u) => u.role === 'gerente')

  function navigate(section) {
    setActiveSection(section)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (section === 'analytics' || section === 'dashboard') {
      load()
    }
  }

  function renderPage() {
    switch (activeSection) {
      case 'restaurantes':
        return (
          <AdminRestaurantesPage
            managers={managers}
            onCreated={load}
            restaurants={restaurants}
          />
        )
      case 'staff':
        return (
          <AdminStaffPage
            onCreated={load}
            restaurants={restaurants}
            users={users}
          />
        )
      case 'analytics':
        return (
          <AdminAnalyticsPage
            overview={overview}
            restaurantStats={restaurantStats}
          />
        )
      case 'anuncios':
        return <AdminPublicacionesPage />
      case 'academic':
        return <AdminAcademicPage />
      case 'dashboard':
      default:
        return (
          <AdminDashboardHome
            onNavigate={navigate}
            overview={overview}
            restaurants={restaurants}
            users={users}
          />
        )
    }
  }

  return (
    <AdminLayout
      activeSection={activeSection}
      onLogout={onLogout}
      onNavigate={navigate}
      user={user}
    >
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      {renderPage()}
    </AdminLayout>
  )
}
