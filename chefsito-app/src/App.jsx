import { useMemo, useState } from 'react'

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

const restaurantsSeed = [
  {
    id: 'r1',
    name: 'Comal Roma',
    cuisine: 'Mexicana',
    address: 'Orizaba 86, Roma Norte',
    distance: '1.2 km',
    waitMinutes: 18,
    people: 14,
    status: 'open',
    lat: 19.4189,
    lng: -99.1611,
  },
  {
    id: 'r2',
    name: 'Nori Condesa',
    cuisine: 'Japonesa',
    address: 'Amsterdam 214, Condesa',
    distance: '2.4 km',
    waitMinutes: 26,
    people: 21,
    status: 'paused',
    lat: 19.4114,
    lng: -99.1715,
  },
  {
    id: 'r3',
    name: 'Brasa Norte',
    cuisine: 'Parrilla',
    address: 'Masaryk 330, Polanco',
    distance: '4.8 km',
    waitMinutes: 12,
    people: 9,
    status: 'open',
    lat: 19.4327,
    lng: -99.194,
  },
]

const waitlistSeed = [
  { id: 'w1', name: 'Mariana Lopez', partySize: 2, wait: 8, status: 'waiting' },
  { id: 'w2', name: 'Diego Perez', partySize: 4, wait: 14, status: 'waiting' },
  { id: 'w3', name: 'Sofia Torres', partySize: 3, wait: 19, status: 'waiting' },
  { id: 'w4', name: 'Carlos Ruiz', partySize: 5, wait: 23, status: 'waiting' },
]

const analyticsByHour = [
  { hour: '12', entries: 18 },
  { hour: '13', entries: 31 },
  { hour: '14', entries: 44 },
  { hour: '15', entries: 27 },
  { hour: '16', entries: 16 },
  { hour: '17', entries: 22 },
  { hour: '18', entries: 35 },
  { hour: '19', entries: 39 },
  { hour: '20', entries: 33 },
]

const roles = ['cliente', 'restaurante']
const sections = ['cliente', 'turno', 'restaurante', 'analytics']

function MetricCard({ label, value }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-950">{value}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyles[status]}`}>
      {statusLabel[status]}
    </span>
  )
}

function AuthPanel({ role, setRole }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-orange-600">/login</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-950">Entrar a Ahorita</h2>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">
            {role}
          </span>
        </div>

        <form className="mt-5 grid gap-3">
          <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
            Email
            <input className="rounded-lg border border-zinc-300 px-3 py-2.5 outline-none ring-orange-500 focus:ring-2" defaultValue="demo@ahorita.mx" type="email" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
            Contrasena
            <input className="rounded-lg border border-zinc-300 px-3 py-2.5 outline-none ring-orange-500 focus:ring-2" defaultValue="password" type="password" />
          </label>
          <button className="mt-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800" type="button">
            Entrar
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-orange-600">/register</p>
        <h2 className="mt-1 text-xl font-semibold text-zinc-950">Crear cuenta</h2>

        <form className="mt-5 grid gap-3 sm:grid-cols-2">
          {['Nombre', 'Email', 'Telefono', 'Contrasena'].map((field) => (
            <label key={field} className="grid gap-1.5 text-sm font-medium text-zinc-700">
              {field}
              <input
                className="rounded-lg border border-zinc-300 px-3 py-2.5 outline-none ring-orange-500 focus:ring-2"
                type={field === 'Contrasena' ? 'password' : 'text'}
              />
            </label>
          ))}
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium text-zinc-700">Rol</p>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-zinc-100 p-1">
              {roles.map((item) => (
                <button
                  key={item}
                  className={`rounded-md px-3 py-2 text-sm font-semibold capitalize ${role === item ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                  onClick={() => setRole(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <button className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 sm:col-span-2" type="button">
            Crear cuenta
          </button>
        </form>
      </div>
    </section>
  )
}

function ClientHome({ restaurants, selectedRestaurant, setSelectedRestaurant, joinWaitlist }) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 p-4">
          <p className="text-sm font-semibold text-orange-600">/home</p>
          <h2 className="mt-1 text-xl font-semibold text-zinc-950">Restaurantes cerca de ti</h2>
        </div>
        <div className="relative h-80 overflow-hidden bg-zinc-100">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#e5e7eb_1px,transparent_1px),linear-gradient(#e5e7eb_1px,transparent_1px)] bg-[size:46px_46px]" />
          <div className="absolute left-[18%] top-[24%] h-20 w-20 rounded-full bg-orange-200/70 blur-xl" />
          <div className="absolute right-[24%] top-[42%] h-24 w-24 rounded-full bg-emerald-200/70 blur-xl" />
          {restaurants.map((restaurant, index) => (
            <button
              key={restaurant.id}
              className={`absolute rounded-full border-4 border-white bg-orange-600 p-2 shadow-lg ${selectedRestaurant.id === restaurant.id ? 'ring-4 ring-orange-300' : ''}`}
              onClick={() => setSelectedRestaurant(restaurant)}
              style={{ left: `${22 + index * 26}%`, top: `${30 + (index % 2) * 22}%` }}
              type="button"
            >
              <span className="block h-3 w-3 rounded-full bg-white" />
            </button>
          ))}
        </div>
        <div className="grid gap-3 border-t border-zinc-200 p-4 sm:grid-cols-3">
          {['Tipo de comida', 'Distancia', 'Tiempo de espera'].map((filter) => (
            <select key={filter} className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700">
              <option>{filter}</option>
            </select>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-orange-600">/restaurant/{selectedRestaurant.id}</p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-950">{selectedRestaurant.name}</h2>
              <p className="mt-1 text-sm text-zinc-500">{selectedRestaurant.address}</p>
            </div>
            <StatusBadge status={selectedRestaurant.status} />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <MetricCard label="Espera" value={`${selectedRestaurant.waitMinutes} min`} />
            <MetricCard label="Fila" value={selectedRestaurant.people} />
            <MetricCard label="Distancia" value={selectedRestaurant.distance} />
          </div>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <select className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700">
              <option>2 personas</option>
              <option>3 personas</option>
              <option>4 personas</option>
              <option>5 personas</option>
            </select>
            <button className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700" onClick={joinWaitlist} type="button">
              Unirme a la fila
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          {restaurants.map((restaurant) => (
            <button
              key={restaurant.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 text-left shadow-sm hover:border-orange-300"
              onClick={() => setSelectedRestaurant(restaurant)}
              type="button"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-zinc-950">{restaurant.name}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{restaurant.cuisine} · {restaurant.distance}</p>
                </div>
                <StatusBadge status={restaurant.status} />
              </div>
              <p className="mt-3 text-sm text-zinc-600">
                {restaurant.waitMinutes} min estimados · {restaurant.people} personas en fila
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function ActiveTurn({ activeEntry, selectedRestaurant, cancelEntry, callClient, confirmArrival }) {
  const isCalled = activeEntry?.status === 'called'

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-orange-600">/turno</p>
      <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-950">
            {activeEntry ? (isCalled ? 'Es tu turno' : 'Turno activo') : 'Sin turno activo'}
          </h2>
          <p className="mt-1 text-zinc-500">
            {activeEntry ? selectedRestaurant.name : 'Unete a una fila desde el mapa para ver tu posicion.'}
          </p>
        </div>
        {activeEntry && (
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${isCalled ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
            {isCalled ? 'Llamado' : 'Esperando'}
          </span>
        )}
      </div>

      {activeEntry && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Posicion" value={`#${activeEntry.position}`} />
            <MetricCard label="Espera" value={`${activeEntry.waitMinutes} min`} />
            <MetricCard label="Personas" value={activeEntry.partySize} />
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50" onClick={cancelEntry} type="button">
              Cancelar turno
            </button>
            <button className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800" onClick={callClient} type="button">
              Simular entry:called
            </button>
            <button className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700" onClick={confirmArrival} type="button">
              Confirmar llegada
            </button>
          </div>
        </>
      )}
    </section>
  )
}

function RestaurantDashboard({ waitlist, restaurantStatus, setRestaurantStatus, callEntry, removeEntry }) {
  const waitingCount = waitlist.filter((entry) => entry.status === 'waiting').length

  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 p-4 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-semibold text-orange-600">/dashboard</p>
            <h2 className="mt-1 text-xl font-semibold text-zinc-950">Fila de Comal Roma</h2>
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1">
            {Object.keys(statusLabel).map((status) => (
              <button
                key={status}
                className={`rounded-md px-3 py-2 text-sm font-semibold ${restaurantStatus === status ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                onClick={() => setRestaurantStatus(status)}
                type="button"
              >
                {statusLabel[status]}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-zinc-200">
          {waitlist.map((entry, index) => (
            <div key={entry.id} className="grid gap-3 p-4 md:grid-cols-[auto_1fr_auto] md:items-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-sm font-semibold text-zinc-700">
                #{index + 1}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-zinc-950">{entry.name}</h3>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
                    {entry.partySize} personas
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-500">{entry.wait} min esperando · {entry.status === 'called' ? 'llamado' : 'en espera'}</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700" onClick={() => callEntry(entry.id)} type="button">
                  Llamar
                </button>
                <button className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50" onClick={() => removeEntry(entry.id)} type="button">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="grid gap-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-orange-600">Metricas de hoy</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <MetricCard label="Total de turnos" value="184" />
            <MetricCard label="Promedio de espera" value="17 min" />
            <MetricCard label="No-shows" value="6.4%" />
            <MetricCard label="Hora pico" value="14:00" />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-orange-600">/register-restaurant</p>
          <form className="mt-4 grid gap-3">
            <input className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2" defaultValue="Comal Roma" />
            <input className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2" defaultValue="Orizaba 86, Roma Norte" />
            <div className="grid grid-cols-3 gap-2">
              <input className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2" defaultValue="19.4189" />
              <input className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2" defaultValue="-99.1611" />
              <input className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-orange-500 focus:ring-2" defaultValue="18" />
            </div>
            <button className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800" type="button">
              Guardar restaurante
            </button>
          </form>
        </div>

        <MetricCard label="Personas esperando" value={waitingCount} />
      </aside>
    </section>
  )
}

function AnalyticsPage() {
  const maxEntries = Math.max(...analyticsByHour.map((item) => item.entries))

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-orange-600">/analytics</p>
          <h2 className="mt-1 text-xl font-semibold text-zinc-950">Reporte diario</h2>
        </div>
        <input className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-700" defaultValue="2026-06-01" type="date" />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <MetricCard label="Total entradas" value="184" />
        <MetricCard label="No-shows" value="12" />
        <MetricCard label="Promedio espera" value="17 min" />
      </div>

      <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex h-72 items-end gap-2">
          {analyticsByHour.map((item) => (
            <div key={item.hour} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex w-full items-end rounded-md bg-white p-1 ring-1 ring-zinc-200" style={{ height: '220px' }}>
                <div
                  className="w-full rounded-sm bg-orange-600"
                  style={{ height: `${Math.max(12, (item.entries / maxEntries) * 100)}%` }}
                  title={`${item.entries} entradas`}
                />
              </div>
              <span className="text-xs font-medium text-zinc-500">{item.hour}:00</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProfilePanel() {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-orange-600">/profile</p>
      <h2 className="mt-1 text-xl font-semibold text-zinc-950">Perfil</h2>
      <form className="mt-5 grid gap-3 sm:grid-cols-2">
        {['Nombre', 'Email', 'Telefono', 'Nueva contrasena'].map((field) => (
          <label key={field} className="grid gap-1.5 text-sm font-medium text-zinc-700">
            {field}
            <input className="rounded-lg border border-zinc-300 px-3 py-2.5 outline-none ring-orange-500 focus:ring-2" />
          </label>
        ))}
        <button className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 sm:col-span-2" type="button">
          Guardar cambios
        </button>
        <button className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 sm:col-span-2" type="button">
          Logout
        </button>
      </form>
    </section>
  )
}

function App() {
  const [role, setRole] = useState('cliente')
  const [section, setSection] = useState('cliente')
  const [restaurants, setRestaurants] = useState(restaurantsSeed)
  const [selectedRestaurant, setSelectedRestaurant] = useState(restaurantsSeed[0])
  const [restaurantStatus, setRestaurantStatus] = useState('open')
  const [waitlist, setWaitlist] = useState(waitlistSeed)
  const [activeEntry, setActiveEntry] = useState(null)

  const activeSection = useMemo(() => {
    if (section === 'cliente') {
      return (
        <>
          <AuthPanel role={role} setRole={setRole} />
          <ClientHome
            joinWaitlist={() => {
              setActiveEntry({
                id: 'active-1',
                partySize: 2,
                position: selectedRestaurant.people + 1,
                waitMinutes: selectedRestaurant.waitMinutes + 6,
                status: 'waiting',
              })
              setRestaurants((current) =>
                current.map((restaurant) =>
                  restaurant.id === selectedRestaurant.id
                    ? { ...restaurant, people: restaurant.people + 1, waitMinutes: restaurant.waitMinutes + 2 }
                    : restaurant,
                ),
              )
              setSelectedRestaurant((current) => ({
                ...current,
                people: current.people + 1,
                waitMinutes: current.waitMinutes + 2,
              }))
              setSection('turno')
            }}
            restaurants={restaurants}
            selectedRestaurant={selectedRestaurant}
            setSelectedRestaurant={setSelectedRestaurant}
          />
          <ProfilePanel />
        </>
      )
    }

    if (section === 'turno') {
      return (
        <ActiveTurn
          activeEntry={activeEntry}
          callClient={() => setActiveEntry((entry) => (entry ? { ...entry, status: 'called' } : entry))}
          cancelEntry={() => setActiveEntry(null)}
          confirmArrival={() => setActiveEntry(null)}
          selectedRestaurant={selectedRestaurant}
        />
      )
    }

    if (section === 'restaurante') {
      return (
        <RestaurantDashboard
          callEntry={(id) =>
            setWaitlist((current) =>
              current.map((entry) => (entry.id === id ? { ...entry, status: 'called' } : entry)),
            )
          }
          removeEntry={(id) => setWaitlist((current) => current.filter((entry) => entry.id !== id))}
          restaurantStatus={restaurantStatus}
          setRestaurantStatus={setRestaurantStatus}
          waitlist={waitlist}
        />
      )
    }

    return <AnalyticsPage />
  }, [activeEntry, restaurantStatus, restaurants, role, section, selectedRestaurant, waitlist])

  return (
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Ahorita</h1>
            <p className="text-sm text-zinc-500">Filas de espera para restaurantes en Mexico</p>
          </div>
          <nav className="flex gap-1 overflow-x-auto rounded-lg bg-zinc-100 p-1">
            {sections.map((item) => (
              <button
                key={item}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold capitalize ${section === item ? 'bg-white text-zinc-950 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                onClick={() => setSection(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 sm:py-6">
        {activeSection}
      </div>
    </main>
  )
}

export default App
