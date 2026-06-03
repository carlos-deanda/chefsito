import { useState } from 'react'
import { api } from '../api/client.js'

const initialForm = {
  name: '',
  cuisine: '',
  address: '',
  lat: '',
  lng: '',
  tableCount: '10',
  status: 'open',
  estimatedWaitMinutes: '15',
  managerId: '',
}

const statusOptions = [
  { value: 'open', label: 'Abierto' },
  { value: 'paused', label: 'Pausado' },
  { value: 'closed', label: 'Cerrado' },
]

export default function CreateRestaurantForm({ managers = [], onCreated }) {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const data = await api('/admin/restaurants', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          cuisine: form.cuisine || null,
          address: form.address,
          lat: Number(form.lat),
          lng: Number(form.lng),
          table_count: Number(form.tableCount),
          status: form.status,
          estimated_wait_minutes: Number(form.estimatedWaitMinutes),
          manager_id: form.managerId || null,
        }),
      })

      setSuccess(data.message)
      setForm(initialForm)
      onCreated?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="grid gap-3" onSubmit={handleSubmit}>
      <h3 className="font-semibold text-zinc-950">Registrar restaurante</h3>

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
            onChange={(e) => updateField('name', e.target.value)}
            required
            value={form.name}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Tipo de cocina
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2"
            onChange={(e) => updateField('cuisine', e.target.value)}
            value={form.cuisine}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-700 sm:col-span-2">
          Direccion
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2"
            onChange={(e) => updateField('address', e.target.value)}
            required
            value={form.address}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Latitud
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2"
            max="90"
            min="-90"
            onChange={(e) => updateField('lat', e.target.value)}
            required
            step="0.0000001"
            type="number"
            value={form.lat}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Longitud
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2"
            max="180"
            min="-180"
            onChange={(e) => updateField('lng', e.target.value)}
            required
            step="0.0000001"
            type="number"
            value={form.lng}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Mesas
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2"
            min="1"
            onChange={(e) => updateField('tableCount', e.target.value)}
            required
            type="number"
            value={form.tableCount}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Espera estimada
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2"
            min="0"
            onChange={(e) => updateField('estimatedWaitMinutes', e.target.value)}
            required
            type="number"
            value={form.estimatedWaitMinutes}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Estado
          <select
            className="rounded-lg border border-zinc-300 px-3 py-2"
            onChange={(e) => updateField('status', e.target.value)}
            value={form.status}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-zinc-700">
          Gerente
          <select
            className="rounded-lg border border-zinc-300 px-3 py-2"
            onChange={(e) => updateField('managerId', e.target.value)}
            value={form.managerId}
          >
            <option value="">Sin gerente</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>{manager.name}</option>
            ))}
          </select>
        </label>
      </div>

      <button
        className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? 'Registrando...' : 'Registrar restaurante'}
      </button>
    </form>
  )
}
