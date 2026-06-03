import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'
// Se quitó MetricCard y StatusBadge de aquí para evitar el conflicto de duplicados
import { AppShell } from '../components/ui.jsx'
// Importación del mapa corregida
import MapaRestaurantes from '../components/MapaRestaurantes.jsx'

export default function UsuarioDashboard({ user, onLogout }) {
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null)
  const [myEntry, setMyEntry] = useState(null)
  const [partySize, setPartySize] = useState(2)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchDashboardData() {
    const [nearby, mine] = await Promise.all([
      api('/restaurants/nearby'),
      api('/waitlist/my'),
    ])

    return {
      restaurants: nearby.restaurants,
      myEntry: mine.entry,
    }
  }

  async function loadData() {
    setLoading(true)
    try {
      const data = await fetchDashboardData()
      setRestaurants(data.restaurants)
      setMyEntry(data.myEntry)
      setSelectedRestaurantId((current) => {
        if (current && data.restaurants.some((restaurant) => restaurant.id === current)) {
          return current
        }
        return data.restaurants[0]?.id ?? null
      })
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function initialLoad() {
      try {
        const data = await fetchDashboardData()

        if (cancelled) return

        setRestaurants(data.restaurants)
        setMyEntry(data.myEntry)
        setSelectedRestaurantId(data.restaurants[0]?.id ?? null)
        setError('')
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    initialLoad()

    return () => {
      cancelled = true
    }
  }, [])

  const selectedRestaurant = useMemo(
    () => restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? restaurants[0] ?? null,
    [restaurants, selectedRestaurantId],
  )

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

  function handleSelectRestaurant(restaurantId) {
    setSelectedRestaurantId(restaurantId)
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
      subtitle="Explora restaurantes desde un mapa interactivo y revisa su información"
      title="Dashboard del cliente"
      user={user}
    >
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <section className="mb-6 overflow-hidden rounded-3xl border border-zinc-200 bg-linear-to-r from-zinc-950 via-zinc-900 to-zinc-800 p-6 text-white shadow-lg">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">Vista principal del cliente</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Encuentra restaurantes, revisa su información y entra a la fila desde aquí</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
              Toca un punto en el mapa o selecciona un restaurante desde la lista para ver su dirección, estado, tiempo estimado y cuántas personas hay esperando.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Restaurantes</p>
              <p className="mt-2 text-3xl font-semibold">{restaurants.length || '3+'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Tu estado</p>
              <p className="mt-2 text-lg font-semibold">{myEntry ? 'Tienes turno' : 'Libre'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-400">Vista</p>
              <p className="mt-2 text-lg font-semibold">Mapa + detalle</p>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
          <div className="animate-pulse rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="h-6 w-40 rounded bg-zinc-200" />
            <div className="mt-5 h-105 rounded-3xl bg-zinc-100" />
          </div>
          <div className="animate-pulse space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="h-6 w-52 rounded bg-zinc-200" />
            <div className="h-28 rounded-3xl bg-zinc-100" />
            <div className="h-28 rounded-3xl bg-zinc-100" />
            <div className="h-12 rounded-2xl bg-zinc-100" />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
          <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">Mapa de restaurantes</p>
                  <h3 className="mt-1 text-xl font-semibold text-zinc-950">Ubicaciones cercanas</h3>
                </div>
                <div className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
                  {restaurants.length} lugares
                </div>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1.45fr_0.9fr]">
              <div className="border-b border-zinc-200 p-4 lg:border-b-0 lg:border-r">
                <div className="relative z-0 h-105 overflow-hidden rounded-3xl border border-zinc-200 shadow-inner">
                  <MapaRestaurantes 
                    restaurants={restaurants}
                    selectedRestaurantId={selectedRestaurant?.id}
                    onSelectRestaurant={handleSelectRestaurant}
                  />
                </div>
              </div>

              <aside className="space-y-4 p-4">
                {selectedRestaurant ? (
                  <>
                    <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">Restaurante seleccionado</p>
                          <h4 className="mt-1 text-2xl font-semibold text-zinc-950">{selectedRestaurant.name}</h4>
                        </div>
                        <StatusBadge status={selectedRestaurant.status} />
                      </div>

                      <p className="mt-3 text-sm text-zinc-600">{selectedRestaurant.cuisine}</p>
                      <p className="mt-1 text-sm text-zinc-500">{selectedRestaurant.address}</p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <MetricCard label="Tiempo estimado" value={`${selectedRestaurant.estimated_wait_minutes} min`} />
                        <MetricCard label="En fila" value={selectedRestaurant.people_waiting} />
                      </div>

                      <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-zinc-600 ring-1 ring-zinc-200">
                        <p className="font-semibold text-zinc-950">Perfil del local</p>
                        <p className="mt-2">
                          {selectedRestaurant.status === 'open'
                            ? 'Está abierto y puedes unirte a la fila desde esta pantalla.'
                            : selectedRestaurant.status === 'paused'
                              ? 'El restaurante está pausado. Puedes revisar la información, pero no unirte todavía.'
                              : 'El restaurante está cerrado por el momento.'}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <label className="text-sm font-medium text-zinc-700">
                          Personas
                          <select
                            className="ml-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
                            onChange={(e) => setPartySize(Number(e.target.value))}
                            value={partySize}
                          >
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <button
                        className="mt-4 w-full rounded-2xl bg-[#f15a24] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#e04f1c] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={Boolean(myEntry) || selectedRestaurant.status !== 'open'}
                        onClick={() => joinQueue(selectedRestaurant.id)}
                        type="button"
                      >
                        {selectedRestaurant.status !== 'open'
                          ? 'No disponible'
                          : myEntry
                            ? 'Ya tienes un turno activo'
                            : 'Unirme a la fila'}
                      </button>
                    </div>

                    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
                      <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">Otros restaurantes</h5>
                      <div className="mt-3 grid gap-3">
                        {restaurants
                          .filter((restaurant) => restaurant.id !== selectedRestaurant.id)
                          .map((restaurant) => (
                            <button
                              key={restaurant.id}
                              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left transition hover:border-orange-300 hover:bg-orange-50"
                              onClick={() => handleSelectRestaurant(restaurant.id)}
                              type="button"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-semibold text-zinc-950">{restaurant.name}</p>
                                  <p className="mt-1 text-sm text-zinc-500">{restaurant.cuisine} · {restaurant.estimated_wait_minutes} min</p>
                                </div>
                                <StatusBadge status={restaurant.status} />
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-sm text-zinc-500">
                    No hay restaurantes para mostrar. Revisa que el backend esté corriendo y que el usuario tenga acceso a la ruta de restaurantes.
                  </div>
                )}

                {restaurants.length > 0 && (
                  <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <h5 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">Lista rápida</h5>
                    <div className="mt-3 space-y-3">
                      {restaurants.map((restaurant) => (
                        <button
                          key={restaurant.id}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                            restaurant.id === selectedRestaurant?.id
                              ? 'border-orange-300 bg-orange-50'
                              : 'border-zinc-200 bg-zinc-50 hover:border-orange-300 hover:bg-orange-50'
                          }`}
                          onClick={() => handleSelectRestaurant(restaurant.id)}
                          type="button"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-zinc-950">{restaurant.name}</p>
                              <p className="mt-1 text-sm text-zinc-500">{restaurant.address}</p>
                            </div>
                            <StatusBadge status={restaurant.status} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </section>
        </div>
      )}

      {myEntry && (
        <section className="mt-6 rounded-3xl border border-orange-200 bg-linear-to-r from-orange-50 to-white p-5 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-600">Tu turno activo</p>
              <h2 className="text-2xl font-semibold text-zinc-950">{myEntry.restaurant_name}</h2>
              <p className="mt-1 text-sm text-zinc-600">{myEntry.restaurant_address}</p>
            </div>
            <p className="text-sm text-zinc-500">Esperas estimadas: {myEntry.estimated_wait_minutes} min</p>
          </div>
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
    </AppShell>
  )
}

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

export function MetricCard({ label, value }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-950">{value}</p>
    </div>
  )
}

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyles[status] ?? statusStyles.closed}`}>
      {statusLabel[status] ?? status}
    </span>
  )
}