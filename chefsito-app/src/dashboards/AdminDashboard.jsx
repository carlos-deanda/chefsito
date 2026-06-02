import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { AppShell, MetricCard } from '../components/ui.jsx'
import CreateStaffForm from '../components/CreateStaffForm.jsx'

export default function AdminDashboard({ user, onLogout }) {
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [error, setError] = useState('')

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
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <AppShell
      onLogout={onLogout}
      subtitle="Panel de administración global"
      title="Admin"
      user={user}
    >
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {overview && (
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Usuarios activos" value={overview.users_count} />
          <MetricCard label="Restaurantes" value={overview.restaurants_count} />
          <MetricCard label="En fila ahora" value={overview.active_waitlist_count} />
        </div>
      )}

      <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <CreateStaffForm onCreated={load} restaurants={restaurants} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 p-4">
            <h2 className="font-semibold text-zinc-950">Personal del sistema</h2>
          </div>
          <ul className="divide-y divide-zinc-100">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-medium text-zinc-950">{u.name}</p>
                  <p className="text-zinc-500">{u.email}</p>
                </div>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold capitalize">
                  {u.role}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 p-4">
            <h2 className="font-semibold text-zinc-950">Restaurantes</h2>
          </div>
          <ul className="divide-y divide-zinc-100">
            {restaurants.map((r) => (
              <li key={r.id} className="p-4 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-zinc-950">{r.name}</p>
                  <span className="text-xs capitalize text-zinc-500">{r.status}</span>
                </div>
                <p className="mt-1 text-zinc-500">{r.address}</p>
                <p className="mt-1 text-zinc-600">{r.people_waiting} en fila · Gerente: {r.manager_name ?? '—'}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  )
}
