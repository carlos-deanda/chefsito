/** Imágenes estables (Wikimedia / Unsplash verificados) por tipo de cocina */
const byCuisine = {
  Mexicana:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Chilaquiles.jpg/220px-Chilaquiles.jpg',
  'Tex-Mex':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Burrito_with_rice.jpg/220px-Burrito_with_rice.jpg',
  Asiática:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Sushi_platter.jpg/220px-Sushi_platter.jpg',
  Japonesa:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Sushi_platter.jpg/220px-Sushi_platter.jpg',
}

const fallbackImages = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Good_Food_Display_-_NCI_Visuals_Online.jpg/220px-Good_Food_Display_-_NCI_Visuals_Online.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Hamburgers.jpg/220px-Hamburgers.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Spaghetti.jpg/220px-Spaghetti.jpg',
]

const cuisineAliases = {
  mexicana: 'Mexicana',
  'tex-mex': 'Tex-Mex',
  texmex: 'Tex-Mex',
  asiatica: 'Asiática',
  asiática: 'Asiática',
  japonesa: 'Japonesa',
}

function resolveCuisineKey(cuisine) {
  if (!cuisine) return null
  const trimmed = cuisine.trim()
  if (byCuisine[trimmed]) return trimmed
  const alias = cuisineAliases[trimmed.toLowerCase()]
  return alias ?? null
}

export function getRestaurantImage(restaurant, index = 0) {
  const cuisineKey = resolveCuisineKey(restaurant?.cuisine)
  if (cuisineKey && byCuisine[cuisineKey]) {
    return byCuisine[cuisineKey]
  }
  return fallbackImages[index % fallbackImages.length]
}

export function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
