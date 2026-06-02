import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { AppShell, MetricCard } from '../components/ui.jsx'
const statusOptions = [
  { value: 'open', label: 'Abierto' },
  { value: 'paused', label: 'Pausado' },
  { value: 'closed', label: 'Cerrado' },
]

function GerenteExtras({ restaurant, onStatusChange, analytics }) {
  return (
  <>
    <div className="mb-6 flex flex-wrap gap-2">
      {statusOptions.map((opt) => (
        <button
          key={opt.value}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            restaurant.status === opt.value
              ? 'bg-zinc-950 text-white'
              : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-50'
          }`}
          onClick={() => onStatusChange(opt.value)}
          type="button"
        >
          {opt.label}
        </button>
      ))}
    </div>

    {analytics && (
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <MetricCard label="Turnos hoy" value={analytics.total_entries} />
        <MetricCard label="No-shows" value={analytics.no_shows} />
        <MetricCard label="Espera promedio" value={`${analytics.avg_wait_minutes} min`} />
        <MetricCard label="Hora pico" value={analytics.peak_hour != null ? `${analytics.peak_hour}:00` : '—'} />
      </div>
    )}
  </>
  )
}

export default function GerenteDashboard({ user, onLogout }) {
  const [restaurant, setRestaurant] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [waitlist, setWaitlist] = useState([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const assigned = await api('/restaurants/my-assigned')
      const r = assigned.restaurant
      setRestaurant(r)
      const [queue, stats] = await Promise.all([
        api(`/restaurants/${r.id}/waitlist`),
        api(`/analytics/${r.id}/daily`),
      ])
      setWaitlist(queue.waitlist)
      setAnalytics(stats)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function updateStatus(status) {
    try {
      await api(`/restaurants/${restaurant.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function callGuest(entryId) {
    await api(`/waitlist/${entryId}/call`, { method: 'POST' })
    await load()
  }

  async function removeGuest(entryId) {
    await api(`/waitlist/${entryId}/remove`, { method: 'DELETE' })
    await load()
  }

  if (!restaurant) {
    return (
      <AppShell onLogout={onLogout} subtitle="Gerente" title="Gerente" user={user}>
        <p className="text-sm text-zinc-500">{error || 'Cargando restaurante…'}</p>
      </AppShell>
    )
  }

  return (
    <AppShell onLogout={onLogout} subtitle={restaurant.name} title="Gerente" user={user}>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <GerenteExtras analytics={analytics} onStatusChange={updateStatus} restaurant={restaurant} />

      <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 p-4">
          <h2 className="font-semibold text-zinc-950">Fila · {waitlist.length} personas</h2>
        </div>
        <ul className="divide-y divide-zinc-100">
          {waitlist.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">#{entry.position} · {entry.guest_name}</p>
                <p className="text-sm text-zinc-500">{entry.party_size} personas · {entry.status}</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white"
                  onClick={() => callGuest(entry.id)}
                  type="button"
                >
                  Llamar
                </button>
                <button
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold"
                  onClick={() => removeGuest(entry.id)}
                  type="button"
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  )
}
