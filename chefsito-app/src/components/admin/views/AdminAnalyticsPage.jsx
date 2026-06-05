import { useMemo, useState } from 'react'
import { IconAnalytics, IconQueue } from '../AdminIcons.jsx'
import HourlyChart from '../analytics/HourlyChart.jsx'
import RoleBreakdown from '../analytics/RoleBreakdown.jsx'
import PageHeader from '../PageHeader.jsx'
import { StatusBadge } from '../../ui.jsx'

const todayLabel = new Date().toLocaleDateString('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

function KpiTile({ label, value, sub, accent }) {
  const accents = {
    orange: 'from-orange-500 to-amber-500',
    violet: 'from-violet-500 to-purple-500',
    rose: 'from-rose-500 to-pink-500',
    emerald: 'from-emerald-500 to-teal-500',
  }
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accents[accent]}`} />
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">{value}</p>
      {sub && <p className="mt-1 text-sm text-zinc-500">{sub}</p>}
    </div>
  )
}

export default function AdminAnalyticsPage({ overview, restaurantStats }) {
  const withData = restaurantStats.filter((r) => r.stats?.total_entries > 0)
  const [selectedId, setSelectedId] = useState(null)

  const effectiveId =
    selectedId ?? withData[0]?.restaurant.id ?? restaurantStats[0]?.restaurant.id ?? ''
  const selected =
    restaurantStats.find((r) => r.restaurant.id === effectiveId) ?? restaurantStats[0]

  const network = useMemo(() => {
    let entries = 0
    let noShows = 0
    let waitSum = 0
    let waitCount = 0
    let activeWaitlist = overview?.active_waitlist_count ?? 0

    for (const { stats } of restaurantStats) {
      if (!stats) continue
      entries += stats.total_entries ?? 0
      noShows += stats.no_shows ?? 0
      if (stats.avg_wait_minutes != null) {
        waitSum += stats.avg_wait_minutes
        waitCount += 1
      }
    }

    const top = [...withData].sort(
      (a, b) => (b.stats?.total_entries ?? 0) - (a.stats?.total_entries ?? 0),
    )[0]

    return {
      entries,
      noShows,
      avgWait: waitCount ? Math.round(waitSum / waitCount) : 0,
      activeWaitlist,
      topName: top?.restaurant.name,
      topEntries: top?.stats?.total_entries ?? 0,
      noShowRate: entries ? Math.round((noShows / entries) * 100) : 0,
    }
  }, [restaurantStats, withData, overview])

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 px-6 py-8 text-white shadow-lg sm:px-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-orange-500/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-orange-200">
              <IconAnalytics className="h-4 w-4 shrink-0 text-orange-300" />
              Analytics en vivo
            </div>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Rendimiento de la red</h2>
            <p className="mt-1 capitalize text-zinc-300">{todayLabel}</p>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-zinc-400">Sucursales</p>
              <p className="text-2xl font-bold">{restaurantStats.length}</p>
            </div>
            <div>
              <p className="text-zinc-400">En fila ahora</p>
              <p className="text-2xl font-bold text-orange-300">{network.activeWaitlist}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          accent="orange"
          label="Turnos hoy (red)"
          sub={network.topName ? `Líder: ${network.topName}` : undefined}
          value={network.entries}
        />
        <KpiTile
          accent="rose"
          label="No-shows"
          sub={`${network.noShowRate}% del total`}
          value={network.noShows}
        />
        <KpiTile
          accent="orange"
          label="Espera promedio"
          sub="Promedio entre sucursales"
          value={`${network.avgWait} min`}
        />
        <KpiTile
          accent="emerald"
          label="Pico del día"
          sub={network.topEntries ? `${network.topEntries} turnos` : 'Sin datos'}
          value={network.topName ? network.topName.split(' ')[0] : '—'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-zinc-950">Equipo por rol</h3>
          <p className="mt-1 text-sm text-zinc-500">Distribución de cuentas activas en la plataforma</p>
          <div className="mt-6">
            {overview?.users_by_role?.length > 0 ? (
              <RoleBreakdown usersByRole={overview.users_by_role} />
            ) : (
              <p className="text-sm text-zinc-500">Sin datos de usuarios</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-3">
          <h3 className="font-semibold text-zinc-950">Comparativa por sucursal</h3>
          <p className="mt-1 text-sm text-zinc-500">Turnos registrados hoy</p>
          <ul className="mt-5 space-y-3">
            {restaurantStats.map(({ restaurant, stats }) => {
              const entries = stats?.total_entries ?? 0
              const max = Math.max(...restaurantStats.map((r) => r.stats?.total_entries ?? 0), 1)
              const width = Math.max(4, (entries / max) * 100)
              return (
                <li key={restaurant.id}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-zinc-800">{restaurant.name}</span>
                    <span className="shrink-0 font-bold text-zinc-950">{entries}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </li>
              )
            })}
            {restaurantStats.length === 0 && (
              <p className="text-sm text-zinc-500">No hay restaurantes registrados</p>
            )}
          </ul>
        </section>
      </div>

      {restaurantStats.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-zinc-100 bg-gradient-to-r from-zinc-50 to-orange-50/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-zinc-950">Detalle por restaurante</h3>
              <p className="text-sm text-zinc-500">Flujo por hora y métricas del día</p>
            </div>
            <select
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
              onChange={(e) => setSelectedId(e.target.value)}
              value={effectiveId}
            >
              {restaurantStats.map(({ restaurant }) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.name}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h4 className="text-lg font-bold text-zinc-950">{selected.restaurant.name}</h4>
                  <p className="mt-0.5 max-w-xl text-sm text-zinc-500">{selected.restaurant.address}</p>
                </div>
                <StatusBadge status={selected.restaurant.status} uppercase />
              </div>

              {selected.stats ? (
                <>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      { label: 'Turnos hoy', value: selected.stats.total_entries, valueClass: 'text-orange-600', boxClass: 'bg-orange-50' },
                      { label: 'No-shows', value: selected.stats.no_shows, valueClass: 'text-rose-600', boxClass: 'bg-rose-50' },
                      {
                        label: 'Espera prom.',
                        value: `${selected.stats.avg_wait_minutes} min`,
                        valueClass: 'text-orange-650',
                        boxClass: 'bg-orange-50/70',
                      },
                      {
                        label: 'Hora pico',
                        value: selected.stats.peak_hour != null ? `${selected.stats.peak_hour}:00` : '—',
                        valueClass: 'text-emerald-600',
                        boxClass: 'bg-emerald-50',
                      },
                    ].map((item) => (
                      <div key={item.label} className={`rounded-xl px-4 py-3 ${item.boxClass}`}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{item.label}</p>
                        <p className={`mt-1 text-2xl font-bold ${item.valueClass}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                        <IconQueue className="h-5 w-5" />
                      </span>
                      <div>
                        <h5 className="font-semibold text-zinc-950">Entradas por hora</h5>
                        <p className="text-xs text-zinc-500">Volumen de turnos durante el día</p>
                      </div>
                    </div>
                    <HourlyChart hours={selected.hourly ?? []} />
                  </div>
                </>
              ) : (
                <p className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center text-sm text-zinc-500">
                  Sin datos de analítica para hoy en esta sucursal.
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {restaurantStats.length === 0 && (
        <p className="rounded-2xl border border-zinc-200 bg-white p-12 text-center text-sm text-zinc-500">
          No hay restaurantes con datos de analítica para hoy.
        </p>
      )}
    </div>
  )
}
