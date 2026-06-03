import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { IconUserPlus } from './admin/AdminIcons.jsx'

const staffRoles = [
  { value: 'recepcionista', label: 'Recepcionista' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'soporte', label: 'Soporte' },
  { value: 'admin', label: 'Administrador' },
]

const inputClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100'

const labelClass = 'text-sm font-medium text-zinc-700'

export default function CreateStaffForm({ restaurants, onCreated }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('recepcionista')
  const [password, setPassword] = useState('password')
  const [restaurantId, setRestaurantId] = useState(restaurants[0]?.id ?? '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (restaurants.length > 0 && !restaurants.some((r) => r.id === restaurantId)) {
      setRestaurantId(restaurants[0].id)
    }
  }, [restaurants, restaurantId])

  const needsRestaurant = role === 'recepcionista' || role === 'gerente'
  const selectedRestaurantExists = restaurants.some((restaurant) => restaurant.id === restaurantId)
  const effectiveRestaurantId = selectedRestaurantExists ? restaurantId : restaurants[0]?.id ?? ''

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const body = { name, email, phone, role, password }
      if (needsRestaurant) {
        body.restaurant_id = effectiveRestaurantId
      }

      const data = await api('/admin/users', {
        method: 'POST',
        body: JSON.stringify(body),
      })

      setSuccess(data.message)
      setName('')
      setEmail('')
      setPhone('')
      setPassword('password')
      onCreated?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2">
        <span className="text-orange-600">
          <IconUserPlus />
        </span>
        <h3 className="text-lg font-semibold text-zinc-950">Crear cuenta de personal</h3>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
      )}

      <label className="grid gap-1.5">
        <span className={labelClass}>Nombre</span>
        <input
          className={inputClass}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre completo"
          required
          value={name}
        />
      </label>

      <label className="grid gap-1.5">
        <span className={labelClass}>Email</span>
        <input
          className={inputClass}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@chefsito.com"
          required
          type="email"
          value={email}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className={labelClass}>Teléfono</span>
          <input
            className={inputClass}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+52 …"
            value={phone}
          />
        </label>
        <label className="grid gap-1.5">
          <span className={labelClass}>Rol</span>
          <select
            className={inputClass}
            onChange={(e) => setRole(e.target.value)}
            value={role}
          >
            {staffRoles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="grid gap-1.5">
        <span className={labelClass}>Contraseña inicial</span>
        <input
          className={inputClass}
          onChange={(e) => setPassword(e.target.value)}
          required
          type="password"
          value={password}
        />
      </label>

      {needsRestaurant && (
        <label className="grid gap-1.5">
          <span className={labelClass}>Restaurante asignado</span>
          <select
            className={inputClass}
            onChange={(e) => setRestaurantId(e.target.value)}
            required
            value={effectiveRestaurantId}
          >
            {restaurants.length === 0 && <option value="">No hay restaurantes</option>}
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </label>
      )}

      <button
        className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        disabled={loading || (needsRestaurant && restaurants.length === 0)}
        type="submit"
      >
        {loading ? 'Creando…' : 'Crear cuenta'}
      </button>
    </form>
  )
}
