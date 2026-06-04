import { useEffect, useMemo, useState, useRef } from 'react'
import { api } from '../api/client.js'
// Se quitó MetricCard y StatusBadge de aquí para evitar el conflicto de duplicados
import { AppShell } from '../components/ui.jsx'
// Importación del mapa corregida
import MapaRestaurantes from '../components/MapaRestaurantes.jsx'
import { io as socketIO } from 'socket.io-client'

function getRestaurantDynamicWaitTime(restaurant) {
  if (!restaurant) return 0
  const baseWait = restaurant.estimated_wait_minutes || 15
  const waitTimePerPerson = Math.max(5, Math.round(baseWait / 3))
  const count = restaurant.people_waiting ?? 0
  return (count + 1) * waitTimePerPerson
}

export default function UsuarioDashboard({ user, onLogout }) {
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null)
  const [myEntry, setMyEntry] = useState(null)
  const [partySize, setPartySize] = useState(2)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cuisineFilter, setCuisineFilter] = useState('all')
  const [sortMode, setSortMode] = useState('default')

  // Nuevos estados para el historial de notificaciones y permisos de escritorio
  const [notifications, setNotifications] = useState([])
  const [publicaciones, setPublicaciones] = useState([])
  const [permissionStatus, setPermissionStatus] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  })

  // Turnos completados o cancelados que el usuario ya cerró
  const [dismissedEntries, setDismissedEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('dismissed_waitlist_entries')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Guardar turnos descartados
  useEffect(() => {
    localStorage.setItem('dismissed_waitlist_entries', JSON.stringify(dismissedEntries))
  }, [dismissedEntries])

  const lastNotifiedEntryIdRef = useRef(null)

  // Escuchar cuando el turno cambia a 'called' para avisar por notificación de Chrome
  useEffect(() => {
    if (myEntry && myEntry.status === 'called') {
      if (lastNotifiedEntryIdRef.current !== myEntry.id) {
        lastNotifiedEntryIdRef.current = myEntry.id
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('🔔 ¡Mesa lista en Chefsito!', {
              body: `Tu mesa en ${myEntry.restaurant_name} está lista. ¡Tienes 5 minutos para entrar, si no tu turno se perderá! Confirma tu llegada.`,
            })
          } catch (e) {
            console.error('Failed to trigger native Notification', e)
          }
        }
      }
    } else if (!myEntry || myEntry.status !== 'called') {
      if (!myEntry) {
        lastNotifiedEntryIdRef.current = null
      }
    }
  }, [myEntry])

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

  async function fetchNotificationsList() {
    try {
      const res = await api('/waitlist/notifications')
      setNotifications(res.notifications || [])
    } catch (err) {
      console.error('Error fetching notifications:', err)
    }
  }

  async function loadData() {
    setLoading(true)
    try {
      const data = await fetchDashboardData()
      setRestaurants(data.restaurants)
      setMyEntry(data.myEntry)
      
      await fetchNotificationsList()
      
      const pubRes = await api('/publicaciones')
      setPublicaciones(pubRes.publicaciones || [])
      
      setSelectedRestaurantId((current) => {
        if (current && data.restaurants.some((restaurant) => restaurant.id === current)) {
          return current
        }
        return null 
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
    const socket = socketIO(import.meta.env.VITE_API_URL ?? 'http://localhost:4000')

    async function initialLoad() {
      try {
        const [data, notifRes, pubRes] = await Promise.all([
          fetchDashboardData(),
          api('/waitlist/notifications'),
          api('/publicaciones'),
        ])

        if (cancelled) return

        setRestaurants(data.restaurants)
        setMyEntry(data.myEntry)
        setNotifications(notifRes.notifications || [])
        setPublicaciones(pubRes.publicaciones || [])
        setSelectedRestaurantId(null)
        
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

    async function refreshData() {
      try {
        const [data, notifRes, pubRes] = await Promise.all([
          fetchDashboardData(),
          api('/waitlist/notifications'),
          api('/publicaciones'),
        ])
        if (cancelled) return
        setRestaurants(data.restaurants)
        setMyEntry(data.myEntry)
        setNotifications(notifRes.notifications || [])
        setPublicaciones(pubRes.publicaciones || [])
      } catch (err) {
        console.error('Error refreshing waitlist data:', err)
      }
    }

    socket.on('restaurant:status_changed', (data) => {
      console.log('Socket event: restaurant:status_changed', data)
      refreshData()
    })

    socket.on('waitlist:changed', (data) => {
      console.log('Socket event: waitlist:changed', data)
      refreshData()
    })

    const interval = setInterval(refreshData, 5000)

    return () => {
      cancelled = true
      clearInterval(interval)
      socket.disconnect()
    }
  }, [])

  const cuisineOptions = useMemo(() => {
    const cuisines = restaurants
      .map((restaurant) => restaurant.cuisine?.trim())
      .filter(Boolean)

    return [...new Set(cuisines)].sort((a, b) => a.localeCompare(b, 'es'))
  }, [restaurants])

  const filteredRestaurants = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()
    const filtered = restaurants.filter((restaurant) => {
      const name = restaurant.name?.toLowerCase() ?? ''
      const cuisine = restaurant.cuisine?.trim() ?? ''
      const matchesSearch = !search || name.includes(search)
      const matchesStatus = statusFilter === 'all' || restaurant.status === statusFilter
      const matchesCuisine = cuisineFilter === 'all' || cuisine === cuisineFilter

      return matchesSearch && matchesStatus && matchesCuisine
    })

    if (sortMode === 'wait_asc') {
      return [...filtered].sort((a, b) => {
        const waitDiff = getRestaurantDynamicWaitTime(a) - getRestaurantDynamicWaitTime(b)
        return waitDiff || (a.name ?? '').localeCompare(b.name ?? '', 'es')
      })
    }

    return filtered
  }, [restaurants, searchTerm, statusFilter, cuisineFilter, sortMode])

  const selectedRestaurant = useMemo(
    () => filteredRestaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ?? null,
    [filteredRestaurants, selectedRestaurantId],
  )

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    statusFilter !== 'all' ||
    cuisineFilter !== 'all' ||
    sortMode !== 'default'

  async function joinQueue(restaurantId) {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch((err) => console.error('Permission request failed', err))
    }
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

  function clearRestaurantFilters() {
    setSearchTerm('')
    setStatusFilter('all')
    setCuisineFilter('all')
    setSortMode('default')
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

  function handleDismissCompletedEntry(entryId) {
    setDismissedEntries((prev) => {
      if (prev.includes(entryId)) return prev
      return [...prev, entryId]
    })
  }

  function handleRequestPermission() {
    if ('Notification' in window) {
      Notification.requestPermission()
        .then((permission) => {
          setPermissionStatus(permission)
        })
        .catch((err) => {
          console.error('Error requesting notification permission:', err)
        })
    }
  }

  const isActiveEntry = myEntry && (myEntry.status === 'waiting' || myEntry.status === 'called')
  const isArrivedUnacknowledged = myEntry && myEntry.status === 'arrived' && !dismissedEntries.includes(myEntry.id)
  const isCancelledUnacknowledged = myEntry && myEntry.status === 'cancelled' && !dismissedEntries.includes(myEntry.id)

  let shellTitle = "Dashboard del cliente"
  let shellSubtitle = "Explora restaurantes desde un mapa interactivo y revisa su información"

  if (isActiveEntry) {
    shellTitle = "Tu Turno Activo"
    shellSubtitle = `Tienes un turno activo en ${myEntry.restaurant_name}`
  } else if (isArrivedUnacknowledged) {
    shellTitle = "¡Tu Mesa Está Lista!"
    shellSubtitle = `Disfruta tu visita en ${myEntry.restaurant_name}`
  } else if (isCancelledUnacknowledged) {
    shellTitle = "Turno Cancelado"
    shellSubtitle = `Tu turno en ${myEntry.restaurant_name} ha finalizado`
  }

  return (
    <AppShell
      onLogout={onLogout}
      subtitle={shellSubtitle}
      title={shellTitle}
      user={user}
    >
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {isActiveEntry ? (
        <ActiveTurnView
          myEntry={myEntry}
          cancelEntry={cancelEntry}
          confirmArrival={confirmArrival}
          notifications={notifications}
          permissionStatus={permissionStatus}
          onRequestPermission={handleRequestPermission}
          publicaciones={publicaciones}
        />
      ) : isArrivedUnacknowledged ? (
        <CelebrationView
          myEntry={myEntry}
          onDismiss={() => handleDismissCompletedEntry(myEntry.id)}
        />
      ) : isCancelledUnacknowledged ? (
        <CancellationView
          myEntry={myEntry}
          onDismiss={() => handleDismissCompletedEntry(myEntry.id)}
        />
      ) : (
        <>
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
                  <p className="mt-2 text-3xl font-semibold">{filteredRestaurants.length || '0'}</p>
                  <p className="mt-1 text-xs text-zinc-400">de {restaurants.length} registrados</p>
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
                      {filteredRestaurants.length} de {restaurants.length} lugares
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-[1.3fr_0.75fr_0.85fr_0.9fr_auto]">
                    <label className="grid gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-450">Buscar</span>
                      <input
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Nombre del restaurante"
                        type="search"
                        value={searchTerm}
                      />
                    </label>

                    <label className="grid gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-450">Estado</span>
                      <select
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        onChange={(e) => setStatusFilter(e.target.value)}
                        value={statusFilter}
                      >
                        <option value="all">Todos</option>
                        <option value="open">Abiertos</option>
                        <option value="closed">Cerrados</option>
                      </select>
                    </label>

                    <label className="grid gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-450">Cocina</span>
                      <select
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        disabled={cuisineOptions.length === 0}
                        onChange={(e) => setCuisineFilter(e.target.value)}
                        value={cuisineFilter}
                      >
                        <option value="all">Todas</option>
                        {cuisineOptions.map((cuisine) => (
                          <option key={cuisine} value={cuisine}>
                            {cuisine}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-450">Orden</span>
                      <select
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                        onChange={(e) => setSortMode(e.target.value)}
                        value={sortMode}
                      >
                        <option value="default">Normal</option>
                        <option value="wait_asc">Menor espera</option>
                      </select>
                    </label>

                    <div className="flex items-end">
                      <button
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-650 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
                        disabled={!hasActiveFilters}
                        onClick={clearRestaurantFilters}
                        type="button"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-0 lg:grid-cols-[1.45fr_0.9fr]">
                  <div className="border-b border-zinc-200 p-4 lg:border-b-0 lg:border-r">
                    <div className="relative z-0 h-105 overflow-hidden rounded-3xl border border-zinc-200 shadow-inner">
                      <MapaRestaurantes 
                        restaurants={filteredRestaurants}
                        selectedRestaurantId={selectedRestaurant?.id}
                        onSelectRestaurant={handleSelectRestaurant}
                      />
                    </div>
                  </div>

                  <aside className="space-y-4 p-4">
                    {selectedRestaurant ? (
                      <>
                        <div className={`rounded-3xl border p-5 transition-all duration-300 ${
                          selectedRestaurant.status === 'closed'
                            ? 'border-rose-350 bg-rose-50/50 backdrop-blur-md ring-4 ring-rose-100/50 shadow-lg shadow-rose-100/25'
                            : 'border-zinc-200 bg-white shadow-sm shadow-zinc-100/40'
                        }`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className={`text-xs font-bold uppercase tracking-[0.18em] ${
                                selectedRestaurant.status === 'closed' ? 'text-rose-600/80' : 'text-zinc-400'
                              }`}>Restaurante seleccionado</p>
                              <h4 className={`mt-1.5 text-2xl font-black tracking-tight ${
                                selectedRestaurant.status === 'closed' ? 'text-rose-950 font-black' : 'text-zinc-950'
                              }`}>{selectedRestaurant.name}</h4>
                            </div>
                            <StatusBadge status={selectedRestaurant.status} />
                          </div>

                          <p className={`mt-3 text-sm font-medium ${
                            selectedRestaurant.status === 'closed' ? 'text-rose-800/90' : 'text-zinc-600'
                          }`}>{selectedRestaurant.cuisine}</p>
                          <p className={`mt-1 text-xs ${
                            selectedRestaurant.status === 'closed' ? 'text-rose-600/70' : 'text-zinc-500'
                          }`}>{selectedRestaurant.address}</p>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            <MetricCard
                              label="Tiempo estimado"
                              value={`${getRestaurantDynamicWaitTime(selectedRestaurant)} min`}
                              theme={selectedRestaurant.status === 'closed' ? 'rose' : 'normal'}
                            />
                            <MetricCard
                              label="En fila"
                              value={selectedRestaurant.people_waiting}
                              theme={selectedRestaurant.status === 'closed' ? 'rose' : 'normal'}
                            />
                          </div>

                          {selectedRestaurant.status === 'closed' ? (
                            <div className="mt-4 rounded-2xl bg-white/90 border border-rose-200/70 p-4 text-sm text-rose-800 backdrop-blur-xs shadow-xs">
                              <p className="font-bold text-rose-950 flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                </span>
                                Fuera de servicio
                              </p>
                              <p className="mt-2 leading-relaxed text-rose-700/90 text-xs">
                                Este local no está recibiendo clientes en la fila de espera por el momento. ¡Te esperamos pronto!
                              </p>
                            </div>
                          ) : (
                            <div className="mt-4 rounded-2xl bg-zinc-50 border border-zinc-200/60 p-4 text-sm text-zinc-650">
                              <p className="font-semibold text-zinc-950 flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Servicio Activo
                              </p>
                              <p className="mt-2 leading-relaxed text-xs">
                                Está abierto y puedes unirte a la fila de espera para reservar tu lugar ahora mismo desde esta pantalla.
                              </p>
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">
                            <label className={`text-sm font-semibold ${selectedRestaurant.status === 'closed' ? 'text-rose-800' : 'text-zinc-700'}`}>
                              Personas
                              <select
                                className={`ml-2 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition ${
                                  selectedRestaurant.status === 'closed'
                                    ? 'border-rose-200 bg-white/80 text-rose-950 focus:ring-rose-200 focus:border-rose-450'
                                    : 'border-zinc-300 bg-white text-zinc-950 focus:ring-orange-100 focus:border-orange-450'
                                }`}
                                onChange={(e) => setPartySize(Number(e.target.value))}
                                value={partySize}
                                disabled={selectedRestaurant.status === 'closed'}
                              >
                                {[1, 2, 3, 4, 5, 6].map((n) => (
                                  <option key={n} value={n}>
                                    {n}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>

                          {selectedRestaurant.status === 'closed' ? (
                            <button
                              className="mt-4 w-full rounded-2xl border border-rose-200 bg-rose-100/20 px-4 py-3.5 text-sm font-bold text-rose-500 cursor-not-allowed transition duration-300"
                              disabled={true}
                              type="button"
                            >
                              Fuera de servicio
                            </button>
                          ) : (
                            <button
                              className="mt-4 w-full rounded-2xl bg-linear-to-r from-orange-500 to-[#f15a24] hover:from-orange-600 hover:to-[#e04f1c] px-4 py-3.5 text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-orange-500/25 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                              disabled={Boolean(myEntry)}
                              onClick={() => joinQueue(selectedRestaurant.id)}
                              type="button"
                            >
                              {myEntry ? 'Ya tienes un turno activo' : 'Unirme a la fila'}
                            </button>
                          )}
                        </div>

                        <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm shadow-zinc-100/40">
                          <h5 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-450">Otros restaurantes</h5>
                          <div className="mt-3 grid gap-3">
                            {filteredRestaurants
                              .filter((restaurant) => restaurant.id !== selectedRestaurant.id)
                              .map((restaurant) => (
                                <button
                                  key={restaurant.id}
                                  className={`rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
                                    restaurant.status === 'closed'
                                      ? 'border-rose-100 bg-rose-50/20 hover:border-rose-350 hover:bg-rose-50/40 text-rose-950'
                                      : 'border-zinc-200 bg-zinc-50/55 hover:border-emerald-350 hover:bg-emerald-50/20'
                                  }`}
                                  onClick={() => handleSelectRestaurant(restaurant.id)}
                                  type="button"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="font-semibold text-zinc-950">{restaurant.name}</p>
                                      <p className="mt-1 text-xs text-zinc-500">
                                        {restaurant.cuisine} · {restaurant.status === 'closed' ? 'Cerrado' : `${getRestaurantDynamicWaitTime(restaurant)} min`}
                                      </p>
                                    </div>
                                    <StatusBadge status={restaurant.status} />
                                  </div>
                                </button>
                              ))}
                          </div>
                        </div>
                      </>
                    ) : filteredRestaurants.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-55/40 p-8 text-center text-sm text-zinc-500">
                        <p className="font-bold text-zinc-700">No se encontraron restaurantes con esos filtros.</p>
                        <p className="mt-2 text-xs leading-relaxed">Prueba cambiando la busqueda, el estado o el tipo de cocina.</p>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-zinc-300 bg-zinc-55/40 p-8 text-center text-sm text-zinc-500">
                        <p className="font-bold text-zinc-700">Explora el mapa</p>
                        <p className="mt-2 text-xs leading-relaxed">Selecciona un marcador en el mapa o búscalo en la lista inferior para ver los detalles de la fila de espera.</p>
                      </div>
                    )}

                    {filteredRestaurants.length > 0 && (
                      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm shadow-zinc-100/40">
                        <h5 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-450">Lista completa de locales</h5>
                        <div className="mt-3 space-y-3">
                          {filteredRestaurants.map((restaurant) => (
                            <button
                              key={restaurant.id}
                              className={`w-full rounded-2xl border px-4 py-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
                                restaurant.id === selectedRestaurant?.id
                                  ? restaurant.status === 'closed'
                                    ? 'border-rose-400 bg-rose-100/40 ring-4 ring-rose-100 shadow-sm'
                                    : 'border-emerald-450 bg-emerald-100/30 ring-4 ring-emerald-100 shadow-sm'
                                  : restaurant.status === 'closed'
                                    ? 'border-rose-100 bg-rose-50/20 hover:border-rose-350 hover:bg-rose-50/40'
                                    : 'border-zinc-200 bg-zinc-50/55 hover:border-emerald-350 hover:bg-emerald-50/20'
                              }`}
                              onClick={() => handleSelectRestaurant(restaurant.id)}
                              type="button"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-zinc-950">{restaurant.name}</p>
                                  <p className="mt-1 text-xs text-zinc-500">{restaurant.address}</p>
                                </div>
                                <StatusBadge status={restaurant.status} />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <PublicacionesCenter
                      publicaciones={publicaciones}
                    />

                    <NotificationCenter
                      notifications={notifications}
                      permissionStatus={permissionStatus}
                      onRequestPermission={handleRequestPermission}
                    />
                  </aside>
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </AppShell>
  )
}

const statusStyles = {
  open: 'bg-emerald-50 text-emerald-700 ring-emerald-250',
  paused: 'bg-amber-50 text-amber-700 ring-amber-250',
  closed: 'bg-rose-50 text-rose-700 ring-rose-250',
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

export function MetricCard({ label, value, theme = 'normal' }) {
  const classes = theme === 'rose'
    ? 'border-rose-200 bg-white/95 text-rose-950 shadow-xs'
    : 'border-zinc-200 bg-white shadow-xs animate-fade-in'
  const labelClasses = theme === 'rose'
    ? 'text-rose-600/80'
    : 'text-zinc-500'
  const valueClasses = theme === 'rose'
    ? 'text-rose-950 font-extrabold'
    : 'text-zinc-950 font-bold'

  return (
    <div className={`rounded-xl border p-4 transition-all duration-300 ${classes}`}>
      <p className={`text-[10px] font-bold tracking-wider uppercase ${labelClasses}`}>{label}</p>
      <p className={`mt-1.5 text-2xl ${valueClasses}`}>{value}</p>
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

function ActiveTurnView({
  myEntry,
  cancelEntry,
  confirmArrival,
  notifications,
  permissionStatus,
  onRequestPermission,
  publicaciones,
}) {
  const isCalled = myEntry.status === 'called'
  const baseWait = myEntry.estimated_wait_minutes || 15
  const waitTimePerPerson = Math.max(5, Math.round(baseWait / 3))
  const dynamicWaitTime = isCalled ? 0 : myEntry.position * waitTimePerPerson

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl">
        {/* Decorative top bar */}
        <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${isCalled ? 'from-emerald-500 to-teal-500' : 'from-orange-500 to-amber-500'}`} />

        <div className="flex flex-col items-center space-y-6">
          {/* Restaurant Header */}
          <div className="text-center space-y-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${isCalled ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-orange-50 text-orange-700 ring-1 ring-orange-200'}`}>
              {isCalled ? 'Mesa lista' : 'En fila de espera'}
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl">
              {myEntry.restaurant_name}
            </h2>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              {myEntry.restaurant_address}
            </p>
          </div>

          {/* Central Queue Circle Indicator */}
          <div className="relative flex items-center justify-center">
            <div className={`absolute h-48 w-48 animate-ping rounded-full opacity-5 ${isCalled ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ animationDuration: '3s' }} />
            
            <div className={`flex h-40 w-40 flex-col items-center justify-center rounded-full border-4 bg-zinc-50 shadow-inner ${isCalled ? 'border-emerald-500/20' : 'border-orange-500/20'}`}>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400">Posición</span>
              <span className={`text-5xl font-black ${isCalled ? 'text-emerald-600' : 'text-orange-600'}`}>
                #{myEntry.position}
              </span>
              <span className="mt-1 text-xs text-zinc-500 font-semibold">
                {myEntry.position === 1 ? '¡Eres el siguiente!' : `Faltan ${myEntry.position - 1} personas`}
              </span>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid w-full gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 text-center">
              <span className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Espera estimada</span>
              <p className="mt-1 text-2xl font-bold text-zinc-950">
                {dynamicWaitTime} min
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 text-center">
              <span className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Tamaño del grupo</span>
              <p className="mt-1 text-2xl font-bold text-zinc-950">
                {myEntry.party_size} personas
              </p>
            </div>
          </div>

          <div className={`w-full rounded-2xl p-5 text-center ${isCalled ? 'bg-emerald-50 text-emerald-950 border border-emerald-100' : 'bg-amber-50 text-amber-950 border border-amber-100'}`}>
            <h4 className="font-bold text-lg">
              {isCalled ? '🔔 ¡Es tu turno!' : '⏳ Fila activa'}
            </h4>
            <p className="mt-2 text-sm leading-relaxed">
              {isCalled 
                ? 'Tu mesa está lista y te están esperando en recepción. Por favor, confirma tu llegada usando el botón de abajo.' 
                : 'Mantente cerca del restaurante. Te enviaremos una notificación cuando sea tu turno.'}
            </p>
            {isCalled && (
              <p className="mt-3 text-xs font-bold text-red-600 animate-pulse bg-red-50 border border-red-100 rounded-lg p-2 inline-block">
                ⚠️ Tienes 5 minutos para entrar, de lo contrario tu turno se perderá.
              </p>
            )}

            {isCalled && (
              <button
                className="mt-4 w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/25 transition hover:bg-emerald-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 animate-bounce cursor-pointer"
                onClick={confirmArrival}
                type="button"
              >
                Confirmar mi llegada
              </button>
            )}
          </div>

          {/* Action cancellation */}
          <div className="pt-2 w-full">
            <button
              className="w-full rounded-xl border border-red-200 bg-red-50/50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700"
              onClick={cancelEntry}
              type="button"
            >
              Cancelar mi turno
            </button>
          </div>
        </div>
      </div>

      <NotificationCenter
        notifications={notifications}
        permissionStatus={permissionStatus}
        onRequestPermission={onRequestPermission}
      />
      <PublicacionesCenter publicaciones={publicaciones} />
    </div>
  )
}

export function NotificationCenter({ notifications, permissionStatus, onRequestPermission }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-100 pb-3">
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">Historial de Notificaciones</h4>
          <p className="text-xs text-zinc-400 mt-0.5">Alertas de tus turnos y reservas</p>
        </div>
        <div>
          {permissionStatus === 'default' && (
            <button
              onClick={onRequestPermission}
              className="flex items-center gap-1.5 rounded-xl bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition ring-1 ring-orange-200 cursor-pointer"
              type="button"
            >
              🔔 Activar avisos de escritorio
            </button>
          )}
          {permissionStatus === 'granted' && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Avisos de Chrome activados
            </span>
          )}
          {permissionStatus === 'denied' && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-450">
              🚫 Avisos bloqueados
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-zinc-100 max-h-60 overflow-y-auto pr-1">
        {notifications.length === 0 ? (
          <p className="py-6 text-center text-xs text-zinc-400 italic">No tienes mensajes recientes</p>
        ) : (
          notifications.map((n) => {
            const channelBadge = {
              whatsapp: 'bg-emerald-50 text-emerald-700 ring-emerald-200/50',
              sms: 'bg-teal-50 text-teal-700 ring-teal-200/50',
              push: 'bg-orange-50 text-orange-700 ring-orange-200/50',
              email: 'bg-sky-50 text-sky-700 ring-sky-200/50',
            }[n.channel] || 'bg-zinc-50 text-zinc-650 ring-zinc-200';

            return (
              <div key={n.id} className="py-3 text-xs space-y-1 hover:bg-zinc-50/50 transition rounded-lg px-2 -mx-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ring-1 ${channelBadge}`}>
                    {n.channel}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {new Date(n.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-zinc-600 leading-relaxed font-medium">{n.message}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function CelebrationView({ myEntry, onDismiss }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-2xl">
        {/* Confetti decoration / gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-400 via-teal-400 to-green-500" />
        
        {/* Pulsing Emoji */}
        <div className="relative flex justify-center mt-4">
          <div className="absolute h-24 w-24 animate-ping rounded-full bg-emerald-100 opacity-30" style={{ animationDuration: '2s' }} />
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-4xl shadow-inner ring-4 ring-emerald-100">
            🍽️
          </div>
        </div>

        <h3 className="mt-8 text-3xl font-black tracking-tight text-zinc-950">¡Buen provecho!</h3>
        <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-emerald-600">
          Tu mesa en {myEntry.restaurant_name} está lista
        </p>

        <p className="mt-4 text-sm leading-relaxed text-zinc-600">
          El personal del restaurante ha asignado tu mesa y tu turno ha sido liberado con éxito. Por favor, dirígete con el recepcionista para ingresar al local.
        </p>

        <div className="mt-6 rounded-2xl bg-zinc-50 border border-zinc-100 p-4 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-zinc-500">
            <span>Restaurante</span>
            <span className="text-zinc-900">{myEntry.restaurant_name}</span>
          </div>
          <div className="flex justify-between text-xs font-semibold text-zinc-500">
            <span>Grupo</span>
            <span className="text-zinc-900">{myEntry.party_size} personas</span>
          </div>
          <div className="flex justify-between text-xs font-semibold text-zinc-500">
            <span>Fecha y Hora</span>
            <span className="text-zinc-900">
              {new Date(myEntry.arrived_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="mt-8 w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-lg transition cursor-pointer"
          type="button"
        >
          Entendido · Buscar otro restaurante
        </button>
      </div>
    </div>
  );
}

function CancellationView({ myEntry, onDismiss }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="relative overflow-hidden rounded-3xl border border-red-200 bg-white p-8 text-center shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-red-400 via-orange-400 to-amber-500" />
        
        <div className="relative flex justify-center mt-4">
          <div className="absolute h-24 w-24 animate-ping rounded-full bg-red-100 opacity-30" style={{ animationDuration: '2s' }} />
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-4xl shadow-inner ring-4 ring-red-100">
            ⚠️
          </div>
        </div>

        <h3 className="mt-8 text-3xl font-black tracking-tight text-zinc-950">Turno Cancelado</h3>
        <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-red-600">
          Tu turno en {myEntry.restaurant_name} ha finalizado
        </p>

        <p className="mt-4 text-sm leading-relaxed text-zinc-600">
          Lamentamos informarte que tu turno ha sido cancelado por el restaurante o por el sistema de espera. Si consideras que esto es un error, por favor comunícate directamente con la recepción del restaurante.
        </p>

        <button
          onClick={onDismiss}
          className="mt-8 w-full rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white hover:bg-zinc-800 transition cursor-pointer"
          type="button"
        >
          Entendido · Regresar al mapa
        </button>
      </div>
    </div>
  );
}

export function PublicacionesCenter({ publicaciones }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">Anuncios y Novedades</h4>
        <p className="text-xs text-zinc-400 mt-0.5">Novedades de los restaurantes en vivo</p>
      </div>

      <div className="divide-y divide-zinc-100 max-h-60 overflow-y-auto pr-1">
        {publicaciones.length === 0 ? (
          <p className="py-6 text-center text-xs text-zinc-400 italic">No hay novedades registradas</p>
        ) : (
          publicaciones.map((p) => (
            <div key={p.id} className="py-3 text-xs space-y-1.5 hover:bg-zinc-50/50 transition rounded-lg px-2 -mx-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-zinc-950 text-sm">{p.title}</span>
                <span className="text-[10px] text-zinc-400 font-medium shrink-0">
                  {new Date(p.created_at).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                </span>
              </div>
              <p className="text-zinc-650 leading-relaxed font-medium">{p.content}</p>
              <div className="flex items-center gap-1 text-[9px] text-zinc-450 font-bold">
                <span>Por: {p.author_name}</span>
                <span className="rounded-md bg-orange-50 px-1 py-0.5 text-orange-600 ring-1 ring-orange-200/50 capitalize">{p.author_role}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
