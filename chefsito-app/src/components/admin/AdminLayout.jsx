import { useState } from 'react'
import {
  IconAnalytics,
  IconBell,
  IconDashboard,
  IconSettings,
  IconRestaurant,
  IconStaff,
  IconSupport,
} from './AdminIcons.jsx'
import { getInitials } from './restaurantImages.js'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', Icon: IconDashboard },
  { id: 'restaurantes', label: 'Restaurantes', Icon: IconRestaurant },
  { id: 'staff', label: 'Staff', Icon: IconStaff },
  { id: 'analytics', label: 'Analytics', Icon: IconAnalytics },
]

export default function AdminLayout({
  user,
  onLogout,
  activeSection,
  onNavigate,
  children,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const initials = getInitials(user.name)

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-950">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white lg:flex">
        <div className="border-b border-zinc-100 px-5 py-5">
          <p className="text-sm font-semibold text-zinc-950">Panel de administración</p>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {navItems.map(({ id, label, Icon }) => {
            const active = activeSection === id
            return (
              <button
                key={id}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-violet-50 text-violet-900'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950'
                }`}
                onClick={() => onNavigate(id)}
                type="button"
              >
                <span className={active ? 'text-orange-600' : 'text-zinc-400'}>
                  <Icon />
                </span>
                {label}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-zinc-100 p-3">
          <a
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"
            href="mailto:soporte@chefsito.mx"
          >
            <span className="text-zinc-400">
              <IconSupport />
            </span>
            Support
          </a>
          <button
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950"
            onClick={onLogout}
            type="button"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
          <div className="flex items-start justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2 lg:hidden">
                <select
                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm"
                  onChange={(e) => onNavigate(e.target.value)}
                  value={activeSection}
                >
                  {navItems.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">Chefsito</h1>
              <p className="mt-1 text-sm text-zinc-500">
                Gestión de operaciones globales y red de restaurantes.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                aria-label="Notificaciones"
                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100"
                type="button"
              >
                <IconBell className="h-5 w-5" />
              </button>
              <button
                aria-label="Configuración"
                className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100"
                onClick={() => setMenuOpen((open) => !open)}
                type="button"
              >
                <IconSettings className="h-5 w-5" />
              </button>
              <div className="relative">
                <button
                  aria-label="Perfil"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-800"
                  onClick={() => setMenuOpen((open) => !open)}
                  type="button"
                >
                  {initials}
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
                    <p className="border-b border-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950">{user.name}</p>
                    <p className="px-4 py-1 text-xs text-zinc-500">Administrador</p>
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

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
