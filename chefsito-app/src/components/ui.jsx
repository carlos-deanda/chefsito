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

export function EditProfileModal({ isOpen, onClose }) {
  const [profile, setProfile] = useState({ bio: '', avatar_url: '', preferences: { favorite_cuisine: '' } })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      setError('')
      setSuccess('')
      api('/profiles')
        .then((res) => {
          const prof = res.profile || { bio: '', avatar_url: '', preferences: { favorite_cuisine: '' } }
          if (!prof.preferences) {
            prof.preferences = { favorite_cuisine: '' }
          }
          setProfile(prof)
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await api('/profiles', {
        method: 'PUT',
        body: JSON.stringify({
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          preferences: profile.preferences,
        }),
      })
      setSuccess(res.message || 'Perfil guardado correctamente')
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <h3 className="text-lg font-bold text-zinc-950">Editar Perfil</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 cursor-pointer"
            type="button"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-zinc-500">Cargando perfil...</div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-600 ring-1 ring-red-500/20">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-xl bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-500/20">
                {success}
              </p>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Foto de Perfil (URL)</label>
              <input
                type="text"
                placeholder="https://ejemplo.com/avatar.jpg"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                value={profile.avatar_url || ''}
                onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Biografía</label>
              <textarea
                placeholder="Cuéntanos un poco sobre ti..."
                rows={3}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 resize-none"
                value={profile.bio || ''}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cocina Favorita</label>
              <select
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                value={profile.preferences?.favorite_cuisine || ''}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    preferences: { ...profile.preferences, favorite_cuisine: e.target.value },
                  })
                }
              >
                <option value="">Ninguna seleccionada</option>
                <option value="Mexicana">Mexicana</option>
                <option value="Asiática">Asiática</option>
                <option value="Tex-Mex">Tex-Mex</option>
                <option value="Italiana">Italiana</option>
                <option value="Hamburguesas">Hamburguesas</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-4">
              <button
                onClick={onClose}
                type="button"
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-650 hover:bg-zinc-50 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#f15a24] hover:bg-[#e04f1c] px-4 py-2 text-sm font-semibold text-white transition shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export function AppShell({ user, onLogout, title, subtitle, children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
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
                    className="w-full px-4 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-50 border-b border-zinc-100 cursor-pointer"
                    onClick={() => {
                      setMenuOpen(false)
                      setProfileModalOpen(true)
                    }}
                    type="button"
                  >
                    Editar Perfil
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-50 cursor-pointer"
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
      <EditProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </main>
  )
}
