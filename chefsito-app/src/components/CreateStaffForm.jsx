import { useState } from 'react'
import { api } from '../api/client.js'

const staffRoles = [
  { value: 'recepcionista', label: 'Recepcionista' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'soporte', label: 'Soporte' },
  { value: 'admin', label: 'Administrador' },
]

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

  const needsRestaurant = role === 'recepcionista' || role === 'gerente'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const body = { name, email, phone, role, password }
      if (needsRestaurant) {
        body.restaurant_id = restaurantId
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
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <h3 className="font-semibold text-zinc-950">Crear cuenta de personal</h3>
      <p className="text-sm text-zinc-500">
        Los clientes se registran solos. Aquí creas admin, recepcionista, gerente y soporte.
      </p>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Nombre
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2"
            onChange={(e) => setName(e.target.value)}
            required
            value={name}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Email (para iniciar sesión)
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2"
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Teléfono
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2"
            onChange={(e) => setPhone(e.target.value)}
            value={phone}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Rol
          <select
            className="rounded-lg border border-zinc-300 px-3 py-2"
            onChange={(e) => setRole(e.target.value)}
            value={role}
          >
            {staffRoles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-700 sm:col-span-2">
          Contraseña inicial
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2"
            onChange={(e) => setPassword(e.target.value)}
            required
            type="text"
            value={password}
          />
        </label>
      </div>

      {needsRestaurant && (
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Restaurante asignado
          <select
            className="rounded-lg border border-zinc-300 px-3 py-2"
            onChange={(e) => setRestaurantId(e.target.value)}
            required
            value={restaurantId}
          >
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </label>
      )}

      <button
        className="rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? 'Creando…' : 'Crear cuenta'}
      </button>
    </form>
  )
}
