import { StatusBadge } from '../ui.jsx'
import { IconMap } from './AdminIcons.jsx'
import RestaurantThumbnail from './RestaurantThumbnail.jsx'

export default function RestaurantCard({ restaurant, index, onEdit, onDelete }) {
  const mapsUrl = `https://www.google.com/maps?q=${restaurant.lat},${restaurant.lng}`

  return (
    <article className="relative flex gap-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 transition-shadow hover:shadow-sm">
      <RestaurantThumbnail index={index} restaurant={restaurant} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2 pr-28">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-zinc-950">{restaurant.name}</h3>
            <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{restaurant.address}</p>
          </div>
        </div>
        <div className="absolute right-3 top-2.5 flex items-center gap-1">
          {onEdit && (
            <button
              onClick={() => onEdit(restaurant)}
              className="rounded-lg p-1 text-xs hover:bg-zinc-100 text-zinc-600 cursor-pointer"
              title="Editar"
              type="button"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(restaurant.id)}
              className="rounded-lg p-1 text-xs hover:bg-red-50 text-red-500 cursor-pointer"
              title="Eliminar"
              type="button"
            >
              🗑️
            </button>
          )}
          <StatusBadge status={restaurant.status} uppercase />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-600">
          <span className="inline-flex items-center gap-1">
            <span aria-hidden className="text-orange-600">◫</span>
            {restaurant.table_count} mesas
          </span>
          <span className="inline-flex items-center gap-1">
            <span aria-hidden className="text-orange-600">⏱</span>
            {restaurant.estimated_wait_minutes}m espera
          </span>
          {restaurant.people_waiting > 0 && (
            <span className="text-orange-700">{restaurant.people_waiting} en fila</span>
          )}
          <a
            className="ml-auto inline-flex items-center gap-1 font-semibold text-orange-600 hover:text-orange-700"
            href={mapsUrl}
            rel="noreferrer"
            target="_blank"
          >
            <IconMap />
            Ver mapa
          </a>
        </div>
      </div>
    </article>
  )
}
