import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { AppShell, MetricCard, StatusBadge } from '../components/ui.jsx'

export default function UsuarioDashboard({ user, onLogout }) {
  const [restaurants, setRestaurants] = useState([])
  const [myEntry, setMyEntry] = useState(null)
  const [partySize, setPartySize] = useState(2)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    try {
      const [nearby, mine] = await Promise.all([
        api('/restaurants/nearby'),
        api('/waitlist/my'),
      ])
      setRestaurants(nearby.restaurants)
      setMyEntry(mine.entry)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function joinQueue(restaurantId) {
    try {
      await api('/waitlist', {
        method: 'POST',
        body: JSON.stringify({ restaurant_id: restaurantId, party_size: partySize }),
      })
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  async function cancelEntry() {
    if (!myEntry) return
    try {
      await api(`/waitlist/${myEntry.id}`, { method: 'DELETE' })
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  async function confirmArrival() {
    if (!myEntry) return
    try {
      await api(`/waitlist/${myEntry.id}/confirm`, { method: 'PUT' })
      await loadData()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AppShell
      onLogout={onLogout}
      subtitle="Restaurantes y filas de espera"
      title="Cliente"
      user={user}
    >
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {myEntry && (
        <section className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-5">
          <h2 className="text-lg font-semibold text-zinc-950">Tu turno activo</h2>
          <p className="mt-1 text-sm text-zinc-600">{myEntry.restaurant_name}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Posición" value={`#${myEntry.position}`} />
            <MetricCard label="Personas" value={myEntry.party_size} />
            <MetricCard label="Estado" value={myEntry.status === 'called' ? 'Llamado' : 'Esperando'} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold"
              onClick={cancelEntry}
              type="button"
            >
              Cancelar turno
            </button>
            {myEntry.status === 'called' && (
              <button
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                onClick={confirmArrival}
                type="button"
              >
                Confirmar llegada
              </button>
            )}
          </div>
        </section>
      )}

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-zinc-700">
          Personas al unirse
          <select
            className="ml-2 rounded-lg border border-zinc-300 px-2 py-1"
            onChange={(e) => setPartySize(Number(e.target.value))}
            value={partySize}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando restaurantes…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r) => (
            <article key={r.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-zinc-950">{r.name}</h3>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-1 text-sm text-zinc-500">{r.cuisine} · {r.address}</p>
              <p className="mt-3 text-sm text-zinc-600">
                {r.estimated_wait_minutes} min estimados · {r.people_waiting} en fila
              </p>
              <button
                className="mt-4 w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                disabled={Boolean(myEntry) || r.status !== 'open'}
                onClick={() => joinQueue(r.id)}
                type="button"
              >
                {r.status !== 'open' ? 'No disponible' : myEntry ? 'Ya tienes turno' : 'Unirme a la fila'}
              </button>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  )
}
