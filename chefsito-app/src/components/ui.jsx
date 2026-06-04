import { useState, useEffect } from 'react'
import { IconBell, IconSettings } from './admin/AdminIcons.jsx'
import { getInitials } from './admin/restaurantImages.js'
import { api } from '../api/client.js'

const statusStyles = {
  open: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  closed: 'bg-zinc-100 text-zinc-655 ring-zinc-200',
}

const statusLabel = {
  open: 'Abierto',
  closed: 'Cerrado',
}

const roleLabel = {
  admin: 'Administrador',
  usuario: 'Cliente',
  recepcionista: 'Recepcionista',
  gerente: 'Gerente',
  soporte: 'Soporte',
}

export function MetricCard({ label, value, icon }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      {icon && (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-zinc-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-zinc-950">{value ?? '—'}</p>
      </div>
    </div>
  )
}

export function StatusBadge({ status, uppercase = false }) {
  const label = statusLabel[status] ?? status
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ${statusStyles[status] ?? statusStyles.closed} ${uppercase ? 'uppercase tracking-wide' : ''}`}
    >
      {label}
    </span>
  )
}

export { roleLabel }

export function AppShell({ user, onLogout, title, subtitle, children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [hasNew, setHasNew] = useState(false)
  const initials = getInitials(user.name)

  const fetchNotifications = () => {
    api('/waitlist/notifications')
      .then((res) => {
        const list = res.notifications || []
        setNotifications(list)
        if (list.length > 0) {
          const lastSent = new Date(list[0].sent_at).getTime()
          const now = Date.now()
          if (now - lastSent < 30000) {
            setHasNew(true)
          }
        }
      })
      .catch((err) => console.error('Error fetching notifications:', err))
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000)
    return () => clearInterval(interval)
  }, [])

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen)
    setMenuOpen(false)
    setHasNew(false)
  }

  const clearNotifications = () => {
    setNotifications([])
    setHasNew(false)
  }

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-start justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">Chefsito</h1>
            <p className="mt-1 text-sm text-zinc-500">{subtitle ?? title}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="relative">
              <button
                aria-label="Notificaciones"
                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 relative"
                onClick={toggleNotifications}
                type="button"
              >
                <IconBell className="h-5 w-5" />
                {hasNew && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-orange-600 animate-pulse" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-zinc-200 bg-white py-2 shadow-lg z-50">
                  <div className="border-b border-zinc-100 px-4 py-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-zinc-950">Notificaciones recientes</p>
                    {notifications.length > 0 && (
                      <button 
                        onClick={clearNotifications}
                        className="text-xs text-orange-600 font-semibold hover:text-orange-700"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-6 text-center text-xs text-zinc-500">No tienes notificaciones</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-3.5 text-xs space-y-1 hover:bg-zinc-50/50 transition">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-zinc-850 capitalize">{n.channel}</span>
                            <span className="text-[10px] text-zinc-400">
                              {new Date(n.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-zinc-600 leading-relaxed font-medium">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              aria-label="Configuración"
              className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100"
              onClick={() => {
                setMenuOpen((open) => !open)
                setNotificationsOpen(false)
              }}
              type="button"
            >
              <IconSettings className="h-5 w-5" />
            </button>
            <div className="relative">
              <button
                aria-label="Perfil"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-800"
                onClick={() => {
                  setMenuOpen((open) => !open)
                  setNotificationsOpen(false)
                }}
                type="button"
              >
                {initials}
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
                  <p className="border-b border-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950">{user.name}</p>
                  <p className="px-4 py-1 text-xs text-zinc-500">{roleLabel[user.role] ?? user.role}</p>
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-50"
                    onClick={() => {
                      setMenuOpen(false)
                      onLogout()
                    }}
                    type="button"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-7xl px-4 py-6">{children}</div>
    </main>
  )
}
