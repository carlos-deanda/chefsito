import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'
import { AppShell, MetricCard, StatusBadge } from '../components/ui.jsx'

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

  const mapPoints = useMemo(() => {
    if (restaurants.length === 0) {
      return []
    }

    const latitudes = restaurants.map((restaurant) => Number(restaurant.lat))
    const longitudes = restaurants.map((restaurant) => Number(restaurant.lng))
    const minLat = Math.min(...latitudes)
    const maxLat = Math.max(...latitudes)
    const minLng = Math.min(...longitudes)
    const maxLng = Math.max(...longitudes)
    const latSpan = maxLat - minLat || 1
    const lngSpan = maxLng - minLng || 1

    return restaurants.map((restaurant) => {
      const x = ((Number(restaurant.lng) - minLng) / lngSpan) * 100
      const y = (1 - (Number(restaurant.lat) - minLat) / latSpan) * 100

      return {
        ...restaurant,
        x: 12 + x * 0.76,
        y: 12 + y * 0.76,
      }
    })
  }, [restaurants])

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
                <div className="relative h-105 overflow-hidden rounded-3xl border border-zinc-200 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_30%),linear-gradient(135deg,#f8fafc,#eef2ff_55%,#fff7ed)] p-4 shadow-inner">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-size-[48px_48px]" />
                  <div className="absolute inset-6 rounded-4xl border border-white/60" />
                  <div className="absolute inset-x-10 top-8 h-24 rounded-full bg-white/35 blur-3xl" />

                  {mapPoints.map((restaurant) => {
                    const isSelected = restaurant.id === selectedRestaurant?.id
                    return (
                      <button
                        key={restaurant.id}
                        className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 rounded-full border px-3 py-2 text-left shadow-lg transition ${
                          isSelected
                            ? 'border-orange-400 bg-white text-zinc-950 ring-4 ring-orange-200'
                            : 'border-white/80 bg-white/95 text-zinc-700 hover:translate-y-[-52%] hover:border-orange-300 hover:text-zinc-950'
                        }`}
                        onClick={() => handleSelectRestaurant(restaurant.id)}
                        style={{ left: `${restaurant.x}%`, top: `${restaurant.y}%` }}
                        type="button"
                      >
                        <span className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold ${isSelected ? 'bg-[#f15a24] text-white' : 'bg-zinc-950 text-white'}`}>
                          {restaurant.name
                            .split(' ')
                            .map((word) => word[0])
                            .join('')
                            .slice(0, 2)}
                        </span>
                        <span className="max-w-35 text-xs font-semibold leading-tight">{restaurant.name}</span>
                      </button>
                    )
                  })}

                  <div className="absolute right-4 bottom-4 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-xs text-zinc-600 shadow-md backdrop-blur">
                    Haz clic en un restaurante para ver su información.
                  </div>
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
