import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { AppShell, MetricCard } from '../components/ui.jsx'

export default function StaffWaitlistDashboard({ user, onLogout, roleTitle }) {
  const [restaurant, setRestaurant] = useState(null)
  const [waitlist, setWaitlist] = useState([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const assigned = await api('/restaurants/my-assigned')
      setRestaurant(assigned.restaurant)
      const queue = await api(`/restaurants/${assigned.restaurant.id}/waitlist`)
      setWaitlist(queue.waitlist)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function callGuest(entryId) {
    try {
      await api(`/waitlist/${entryId}/call`, { method: 'POST' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function removeGuest(entryId) {
    try {
      await api(`/waitlist/${entryId}/remove`, { method: 'DELETE' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AppShell onLogout={onLogout} subtitle={restaurant?.name ?? 'Cargando…'} title={roleTitle} user={user}>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {restaurant && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <MetricCard label="En fila" value={waitlist.length} />
            <MetricCard label="Espera estimada" value={`${restaurant.estimated_wait_minutes} min`} />
            <MetricCard label="Estado local" value={restaurant.status} />
          </div>

          <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 p-4">
              <h2 className="font-semibold text-zinc-950">Fila de espera</h2>
            </div>
            {waitlist.length === 0 ? (
              <p className="p-6 text-sm text-zinc-500">No hay personas en la fila.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {waitlist.map((entry) => (
                  <li key={entry.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-zinc-950">
                        #{entry.position} · {entry.guest_name}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {entry.party_size} personas · {entry.wait_minutes ?? '—'} min · {entry.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                        onClick={() => callGuest(entry.id)}
                        type="button"
                      >
                        Llamar
                      </button>
                      <button
                        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700"
                        onClick={() => removeGuest(entry.id)}
                        type="button"
                      >
                        Quitar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AppShell>
  )
}
