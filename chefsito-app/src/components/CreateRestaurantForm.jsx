import { useState } from 'react'
import { api } from '../api/client.js'
import { IconStore } from './admin/AdminIcons.jsx'

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

const inputClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100'

const labelClass = 'text-sm font-medium text-zinc-700'

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
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="flex items-center gap-2">
        <span className="text-orange-600">
          <IconStore />
        </span>
        <h3 className="text-lg font-semibold text-zinc-950">Registrar restaurante</h3>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5">
          <span className={labelClass}>Nombre</span>
          <input
            className={inputClass}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Ej. Sushi N Boru"
            required
            value={form.name}
          />
        </label>
        <label className="grid gap-1.5">
          <span className={labelClass}>Tipo de cocina</span>
          <input
            className={inputClass}
            onChange={(e) => updateField('cuisine', e.target.value)}
            placeholder="Ej. Japonesa"
            value={form.cuisine}
          />
        </label>
        <label className="grid gap-1.5 sm:col-span-2">
          <span className={labelClass}>Dirección</span>
          <input
            className={inputClass}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Calle, Número, Colonia"
            required
            value={form.address}
          />
        </label>
        <label className="grid gap-1.5">
          <span className={labelClass}>Latitud</span>
          <input
            className={inputClass}
            max="90"
            min="-90"
            onChange={(e) => updateField('lat', e.target.value)}
            placeholder="20.67"
            required
            step="0.0000001"
            type="number"
            value={form.lat}
          />
        </label>
        <label className="grid gap-1.5">
          <span className={labelClass}>Longitud</span>
          <input
            className={inputClass}
            max="180"
            min="-180"
            onChange={(e) => updateField('lng', e.target.value)}
            placeholder="-103.34"
            required
            step="0.0000001"
            type="number"
            value={form.lng}
          />
        </label>
        <label className="grid gap-1.5">
          <span className={labelClass}>Mesas</span>
          <input
            className={inputClass}
            min="1"
            onChange={(e) => updateField('tableCount', e.target.value)}
            required
            type="number"
            value={form.tableCount}
          />
        </label>
        <label className="grid gap-1.5">
          <span className={labelClass}>Espera estimada (min)</span>
          <input
            className={inputClass}
            min="0"
            onChange={(e) => updateField('estimatedWaitMinutes', e.target.value)}
            required
            type="number"
            value={form.estimatedWaitMinutes}
          />
        </label>
        <label className="grid gap-1.5">
          <span className={labelClass}>Estado</span>
          <select
            className={inputClass}
            onChange={(e) => updateField('status', e.target.value)}
            value={form.status}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className={labelClass}>Gerente</span>
          <select
            className={inputClass}
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
        className="w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? 'Registrando…' : 'Registrar restaurante'}
      </button>
    </form>
  )
}
