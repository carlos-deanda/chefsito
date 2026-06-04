import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// 1. Diseño del Pin personalizado con Tailwind y color-code por estado
const createCustomIcon = (restaurantName, status, isSelected) => {
  const initials = restaurantName.split(' ').map((word) => word[0]).join('').slice(0, 2)
  
  // Estilos según el estado (open, paused, closed)
  const colors = {
    open: {
      badge: 'bg-emerald-500 text-white',
      selectedBorder: 'border-emerald-500 ring-4 ring-emerald-100',
      normalBorder: 'border-emerald-200 hover:border-emerald-400 hover:text-emerald-950',
    },
    paused: {
      badge: 'bg-amber-500 text-white',
      selectedBorder: 'border-amber-500 ring-4 ring-amber-100',
      normalBorder: 'border-amber-200 hover:border-amber-400 hover:text-amber-950',
    },
    closed: {
      badge: 'bg-rose-500 text-white',
      selectedBorder: 'border-rose-500 ring-4 ring-rose-100',
      normalBorder: 'border-rose-200 hover:border-rose-400 hover:text-rose-950',
    }
  }[status] || {
    badge: 'bg-zinc-500 text-white',
    selectedBorder: 'border-zinc-500 ring-4 ring-zinc-100',
    normalBorder: 'border-zinc-200 hover:border-zinc-400 hover:text-zinc-950',
  }

  const activeClasses = isSelected
    ? `${colors.selectedBorder} bg-white text-zinc-950 scale-110 z-[1000]`
    : `${colors.normalBorder} bg-white text-zinc-700 hover:shadow-lg`

  return L.divIcon({
    html: `
      <div class="flex flex-col items-center gap-1 rounded-full border px-3 py-1.5 shadow-md transition-all ${activeClasses}" style="transform: translate(-50%, -100%); min-width: 90px;">
        <span class="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${colors.badge}">
          ${initials}
        </span>
        <span class="text-[10px] font-semibold leading-tight truncate max-w-[80px] text-center">${restaurantName}</span>
      </div>
    `,
    className: 'custom-leaflet-marker',
    iconAnchor: [0, 0],
  })
}

// Icono azul especial para marcar DÓNDE ESTÁS TÚ en el mapa
const userIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

// Componente auxiliar que mueve la cámara del mapa suavemente
function ChangeMapCamera({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { animate: true, duration: 1.5 })
    }
  }, [center, zoom, map])
  return null
}

export default function MapaRestaurantes({ restaurants, selectedRestaurantId, onSelectRestaurant }) {
  // Estado para guardar las coordenadas reales del usuario [lat, lng]
  const [userLocation, setUserLocation] = useState(null)

  // 2. EFECTO PARA SOLICITAR LA UBICACIÓN REAL DEL NAVEGADOR
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Si el usuario acepta el permiso, guardamos sus coordenadas reales
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        (error) => {
          console.error("Error obteniendo la geolocalización o permiso denegado:", error)
        },
        { enableHighAccuracy: true } // Fuerza a usar el GPS del dispositivo si está disponible
      )
    }
  }, [])

  // 3. CENTRO INICIAL DINÁMICO
  // Si ya tenemos tu ubicación real, el mapa arranca ahí. Si no, usa el primer restaurante o CDMX.
  const defaultCenter = useMemo(() => {
    if (userLocation) return userLocation
    if (restaurants.length > 0) return [Number(restaurants[0].lat), Number(restaurants[0].lng)]
    return [19.4326, -99.1332]
  }, [userLocation, restaurants])

  // Buscar si el usuario seleccionó un restaurante de la lista lateral para mover la cámara hacia allá
  const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId)

  // Decidir hacia dónde debe apuntar la cámara en cada momento
  const cameraTarget = useMemo(() => {
    if (selectedRestaurant) return [Number(selectedRestaurant.lat), Number(selectedRestaurant.lng)]
    if (userLocation) return userLocation
    return null
  }, [selectedRestaurant, userLocation])

  return (
    <MapContainer
      center={defaultCenter}
      zoom={14}
      style={{ width: '100%', height: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      {/* Controlador automático de la cámara del mapa */}
      {cameraTarget && (
        <ChangeMapCamera center={cameraTarget} zoom={selectedRestaurant ? 16 : 14} />
      )}

      {/* 4. PIN DE TU UBICACIÓN ACTUAL REAL */}
      {userLocation && (
        <Marker position={userLocation} icon={userIcon}>
          {/* El globo que sale si le das clic a tu propio marcador */}
          <div className="leaflet-popup-content-wrapper">
            <div className="p-1 text-xs font-bold text-zinc-950">¡Estás aquí!</div>
          </div>
        </Marker>
      )}

      {/* 5. RENDER DE LOS RESTAURANTES */}
      {restaurants.map((restaurant) => {
        const isSelected = restaurant.id === selectedRestaurantId

        return (
          <Marker
            key={restaurant.id}
            position={[Number(restaurant.lat), Number(restaurant.lng)]}
            icon={createCustomIcon(restaurant.name, restaurant.status, isSelected)}
            eventHandlers={{
              click: () => onSelectRestaurant(restaurant.id),
            }}
          />
        )
      })}
    </MapContainer>
  )
} 