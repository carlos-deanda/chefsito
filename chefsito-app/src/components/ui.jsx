import { useState } from 'react'
import { IconBell, IconSettings } from './admin/AdminIcons.jsx'
import { getInitials } from './admin/restaurantImages.js'

const statusStyles = {
  open: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  paused: 'bg-amber-50 text-amber-700 ring-amber-200',
  closed: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
}

const statusLabel = {
  open: 'Abierto',
  paused: 'Pausado',
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
  const initials = getInitials(user.name)

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-start justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">Chefsito</h1>
            <p className="mt-1 text-sm text-zinc-500">{subtitle ?? title}</p>
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
