import { roleLabel } from '../../ui.jsx'

const roleStyles = {
  admin: { bar: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700' },
  gerente: { bar: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700' },
  recepcionista: { bar: 'bg-sky-500', bg: 'bg-sky-50', text: 'text-sky-700' },
  soporte: { bar: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  usuario: { bar: 'bg-zinc-400', bg: 'bg-zinc-100', text: 'text-zinc-600' },
}

export default function RoleBreakdown({ usersByRole = [] }) {
  const total = usersByRole.reduce((sum, row) => sum + row.count, 0) || 1

  return (
    <div className="space-y-4">
      {usersByRole.map((row) => {
        const pct = Math.round((row.count / total) * 100)
        const style = roleStyles[row.role] ?? roleStyles.usuario
        return (
          <div key={row.role}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.bg} ${style.text}`}>
                {roleLabel[row.role] ?? row.role}
              </span>
              <span className="text-sm font-bold text-zinc-950">
                {row.count}
                <span className="ml-1 text-xs font-medium text-zinc-400">({pct}%)</span>
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${style.bar}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
