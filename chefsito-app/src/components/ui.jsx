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
  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Chefsito</h1>
            <p className="text-sm text-zinc-500">{subtitle ?? title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-800">
              {roleLabel[user.role] ?? user.role}
            </span>
            <span className="text-sm text-zinc-600">{user.name}</span>
            <button
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              onClick={onLogout}
              type="button"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-7xl px-4 py-6">{children}</div>
    </main>
  )
}
