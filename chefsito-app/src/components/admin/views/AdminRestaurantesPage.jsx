import { useState } from 'react'
import { api } from '../../../api/client.js'
import CreateRestaurantForm from '../../CreateRestaurantForm.jsx'
import RestaurantCard from '../RestaurantCard.jsx'
import PageHeader from '../PageHeader.jsx'

export default function AdminRestaurantesPage({ restaurants, managers, onCreated }) {
  const [editingRestaurant, setEditingRestaurant] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleEditClick = (restaurant) => {
    setEditingRestaurant({ ...restaurant })
    setError('')
    setSuccess('')
  }

  const handleDeleteClick = async (restaurantId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este restaurante? Se borrarán en cascada las filas de espera, el personal asignado y las analíticas.')) {
      return
    }

    try {
      const res = await api(`/admin/restaurants/${restaurantId}`, { method: 'DELETE' })
      alert(res?.message || 'Restaurante eliminado correctamente.')
      onCreated() // Refrescar lista
    } catch (err) {
      alert(`Error al eliminar: ${err.message}`)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await api(`/admin/restaurants/${editingRestaurant.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingRestaurant.name,
          cuisine: editingRestaurant.cuisine,
          address: editingRestaurant.address,
          lat: Number(editingRestaurant.lat),
          lng: Number(editingRestaurant.lng),
          table_count: Number(editingRestaurant.table_count),
          status: editingRestaurant.status,
          estimated_wait_minutes: Number(editingRestaurant.estimated_wait_minutes),
        }),
      })

      setSuccess(res.message || 'Restaurante actualizado correctamente.')
      setTimeout(() => {
        setEditingRestaurant(null)
        onCreated() // Refrescar lista
      }, 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        description="Registra sucursales, edita sus datos o elimínalas del sistema."
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
              <RestaurantCard
                index={index}
                key={r.id}
                restaurant={r}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            ))}
            {restaurants.length === 0 && (
              <p className="py-12 text-center text-sm text-zinc-500">
                Aún no hay restaurantes. Registra el primero con el formulario.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Modal de edición */}
      {editingRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <h3 className="text-lg font-bold text-zinc-950">Editar Restaurante</h3>
              <button
                onClick={() => setEditingRestaurant(null)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 cursor-pointer"
                type="button"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              {error && (
                <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-600 ring-1 ring-red-500/20">
                  {error}
                </p>
              )}
              {success && (
                <p className="rounded-xl bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-500/20">
                  {success}
                </p>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nombre</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                  value={editingRestaurant.name || ''}
                  onChange={(e) => setEditingRestaurant({ ...editingRestaurant, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Cocina</label>
                <input
                  type="text"
                  placeholder="Ej. Mexicana, Italiana"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                  value={editingRestaurant.cuisine || ''}
                  onChange={(e) => setEditingRestaurant({ ...editingRestaurant, cuisine: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Dirección</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                  value={editingRestaurant.address || ''}
                  onChange={(e) => setEditingRestaurant({ ...editingRestaurant, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Latitud</label>
                  <input
                    type="number"
                    step="0.0000001"
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                    value={editingRestaurant.lat || ''}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, lat: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Longitud</label>
                  <input
                    type="number"
                    step="0.0000001"
                    required
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                    value={editingRestaurant.lng || ''}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, lng: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Mesas</label>
                  <input
                    type="number"
                    required
                    min="1"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                    value={editingRestaurant.table_count || ''}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, table_count: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Espera (Min)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                    value={editingRestaurant.estimated_wait_minutes || ''}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, estimated_wait_minutes: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Estado</label>
                <select
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                  value={editingRestaurant.status || ''}
                  onChange={(e) => setEditingRestaurant({ ...editingRestaurant, status: e.target.value })}
                >
                  <option value="open">Abierto</option>
                  <option value="paused">Pausado</option>
                  <option value="closed">Cerrado</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-4">
                <button
                  onClick={() => setEditingRestaurant(null)}
                  type="button"
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-650 hover:bg-zinc-50 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#f15a24] hover:bg-[#e04f1c] px-4 py-2 text-sm font-semibold text-white transition shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
