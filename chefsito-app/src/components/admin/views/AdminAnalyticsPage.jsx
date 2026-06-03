import PageHeader from '../PageHeader.jsx'
import { MetricCard, roleLabel } from '../../ui.jsx'

export default function AdminAnalyticsPage({ overview, restaurantStats }) {
  return (
    <>
      <PageHeader
        description="Métricas del día por restaurante y distribución de usuarios en la plataforma."
        title="Analytics"
      />

      {overview?.users_by_role?.length > 0 && (
        <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-700">Usuarios por rol</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {overview.users_by_role.map((row) => (
              <li
                key={row.role}
                className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700"
              >
                {roleLabel[row.role] ?? row.role}: {row.count}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="space-y-6">
        {restaurantStats.length === 0 && (
          <p className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
            No hay restaurantes con datos de analítica para hoy.
          </p>
        )}
        {restaurantStats.map(({ restaurant, stats }) => (
          <section
            key={restaurant.id}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <h3 className="font-semibold text-zinc-950">{restaurant.name}</h3>
            <p className="mt-0.5 text-sm text-zinc-500">{restaurant.address}</p>
            {stats ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Turnos hoy" value={stats.total_entries} />
                <MetricCard label="No-shows" value={stats.no_shows} />
                <MetricCard label="Espera promedio" value={`${stats.avg_wait_minutes} min`} />
                <MetricCard
                  label="Hora pico"
                  value={stats.peak_hour != null ? `${stats.peak_hour}:00` : '—'}
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">Sin datos de analítica para hoy.</p>
            )}
          </section>
        ))}
      </div>
    </>
  )
}
