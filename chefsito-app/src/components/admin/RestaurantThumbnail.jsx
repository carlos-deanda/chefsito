import { useState } from 'react'
import { getInitials, getRestaurantImage } from './restaurantImages.js'

export default function RestaurantThumbnail({ restaurant, index }) {
  const sources = [
    getRestaurantImage(restaurant, index),
    `https://picsum.photos/seed/${encodeURIComponent(restaurant.id)}/200/200`,
  ]
  const [sourceIndex, setSourceIndex] = useState(0)
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        aria-hidden
        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 text-sm font-bold text-orange-800"
      >
        {getInitials(restaurant.name)}
      </div>
    )
  }

  return (
    <img
      alt=""
      className="h-20 w-20 shrink-0 rounded-lg object-cover bg-zinc-100"
      loading="lazy"
      onError={() => {
        if (sourceIndex < sources.length - 1) {
          setSourceIndex((i) => i + 1)
        } else {
          setFailed(true)
        }
      }}
      src={sources[sourceIndex]}
    />
  )
}
