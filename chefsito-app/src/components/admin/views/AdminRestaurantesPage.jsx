import CreateRestaurantForm from '../../CreateRestaurantForm.jsx'
import RestaurantCard from '../RestaurantCard.jsx'
import PageHeader from '../PageHeader.jsx'

export default function AdminRestaurantesPage({ restaurants, managers, onCreated }) {
  return (
    <>
      <PageHeader
        description="Registra sucursales y consulta el estado de cada una en la red."
        title="Restaurantes"
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <CreateRestaurantForm managers={managers} onCreated={onCreated} />
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-zinc-950">
            Red activa ({restaurants.length})
          </h3>
          <div className="max-h-[calc(100vh-16rem)] space-y-3 overflow-y-auto pr-1">
            {restaurants.map((r, index) => (
              <RestaurantCard index={index} key={r.id} restaurant={r} />
            ))}
            {restaurants.length === 0 && (
              <p className="py-12 text-center text-sm text-zinc-500">
                Aún no hay restaurantes. Registra el primero con el formulario.
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
