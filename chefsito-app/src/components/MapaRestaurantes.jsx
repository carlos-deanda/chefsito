import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'

// 1. IMPORTAR ESTILOS Y REPARAR MARCADOR INVISIBLE
// Leaflet necesita sus estilos CSS para no romperse.
import 'leaflet/dist/leaflet.css'

// Creamos un contenedor invisible para poder meter código HTML/Tailwind dentro del Pin de Leaflet
const createCustomIcon = (restaurantName, isSelected) => {
  const initials = restaurantName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)

  const activeClasses = isSelected
    ? 'border-orange-400 bg-white text-zinc-950 ring-4 ring-orange-200 scale-110 z-[1000]'
    : 'border-zinc-200 bg-white text-zinc-700 hover:border-orange-300 hover:text-zinc-950'

  return L.divIcon({
    html: `
      <div class="flex flex-col items-center gap-1 rounded-full border px-3 py-1.5 shadow-md transition-all ${activeClasses}" style="transform: translate(-50%, -100%); min-width: 90px;">
        <span class="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${isSelected ? 'bg-[#f15a24] text-white' : 'bg-zinc-950 text-white'}">
          ${initials}
        </span>
        <span class="text-[10px] font-semibold leading-tight truncate max-w-[80px] text-center">${restaurantName}</span>
      </div>
    `,
    className: 'custom-leaflet-marker', // Quitamos los estilos por defecto de Leaflet
    iconAnchor: [0, 0],
  })
}

// 2. COMPONENTE PARA ANIMAR EL MAPA (Efecto FlyTo de OpenStreetMap)
function RecenterMap({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 15, {
        animate: true,
        duration: 1.5, // Duración de la animación en segundos
      })
    }
  }, [lat, lng, map])
  return null
}

export default function MapaRestaurantes({ restaurants, selectedRestaurantId, onSelectRestaurant }) {
  
  // Coordenadas del centro inicial (basado en tu primer restaurante)
  const center = useMemo(() => {
    if (restaurants.length > 0) {
      return [Number(restaurants[0].lat), Number(restaurants[0].lng)]
    }
    return [19.4326, -99.1332] // CDMX por defecto
  }, [restaurants])

  const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId)

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      {/* 3. TILE LAYER: Usamos el estilo de CartoDB (Positron) que es un gris claro minimalista y súper elegante */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      {/* Manejador de animación al cambiar de restaurante */}
      {selectedRestaurant && (
        <RecenterMap lat={Number(selectedRestaurant.lat)} lng={Number(selectedRestaurant.lng)} />
      )}

      {/* 4. RENDER DE MARCADORES */}
      {restaurants.map((restaurant) => {
        const isSelected = restaurant.id === selectedRestaurantId

        return (
          <Marker
            key={restaurant.id}
            position={[Number(restaurant.lat), Number(restaurant.lng)]}
            icon={createCustomIcon(restaurant.name, isSelected)}
            eventHandlers={{
              click: () => onSelectRestaurant(restaurant.id),
            }}
          />
        )
      })}
    </MapContainer>
  )
}