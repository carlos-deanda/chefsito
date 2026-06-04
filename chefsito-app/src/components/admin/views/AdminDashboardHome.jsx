import RestaurantCard from '../RestaurantCard.jsx'
import StaffList from '../StaffList.jsx'
import { IconQueue, IconUsers, IconUtensils } from '../AdminIcons.jsx'
import PageHeader from '../PageHeader.jsx'
import { MetricCard } from '../../ui.jsx'

export default function AdminDashboardHome({ overview, users, restaurants, onNavigate }) {
  return (
    <>
      <PageHeader
        description="Resumen general de la red de restaurantes."
        title="Dashboard"
      />

      {overview && (
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard icon={<IconUsers />} label="Usuarios activos" value={overview.users_count} />
          <MetricCard icon={<IconUtensils />} label="Restaurantes" value={overview.restaurants_count} />
          <MetricCard icon={<IconQueue />} label="En fila ahora" value={overview.active_waitlist_count} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <h3 className="font-semibold text-zinc-950">Personal del sistema</h3>
            <button
              className="text-sm font-semibold text-orange-600 hover:text-orange-700"
              onClick={() => onNavigate('staff')}
              type="button"
            >
              Ver todo
            </button>
          </div>
          <StaffList limit={5} users={users} />
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-950">Restaurantes activos</h3>
            <button
              className="text-sm font-semibold text-orange-600 hover:text-orange-700"
              onClick={() => onNavigate('restaurantes')}
              type="button"
            >
              Ver todos
            </button>
          </div>
          <div className="space-y-3">
            {restaurants.slice(0, 3).map((r, index) => (
              <RestaurantCard index={index} key={r.id} restaurant={r} />
            ))}
            {restaurants.length === 0 && (
              <p className="py-8 text-center text-sm text-zinc-500">No hay restaurantes registrados</p>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
