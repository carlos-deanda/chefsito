import { useState, useEffect } from 'react'
import { api } from '../../../api/client.js'
import PageHeader from '../PageHeader.jsx'

export default function AdminAcademicPage() {
  const [amenities, setAmenities] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [newAmenity, setNewAmenity] = useState({ name: '', description: '' })
  const [linkForm, setLinkForm] = useState({ restaurant_id: '', amenity_id: '' })
  const [editingAmenity, setEditingAmenity] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const [amRes, restRes] = await Promise.all([
        api('/amenities'),
        api('/amenities/restaurants'),
      ])
      setAmenities(amRes.amenities || [])
      setRestaurants(restRes.restaurants || [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      fetchData()
    }, 0)

    return () => window.clearTimeout(timerId)
  }, [])

  const handleCreateAmenity = async (e) => {
    e.preventDefault()
    if (!newAmenity.name.trim()) return
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const res = await api('/amenities', {
        method: 'POST',
        body: JSON.stringify(newAmenity),
      })
      setSuccess(res.message || 'Amenidad registrada correctamente.')
      setNewAmenity({ name: '', description: '' })
      await fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleLink = async (e) => {
    e.preventDefault()
    if (!linkForm.restaurant_id || !linkForm.amenity_id) return
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const res = await api('/amenities/link', {
        method: 'POST',
        body: JSON.stringify(linkForm),
      })
      setSuccess(res.message || 'Amenidad vinculada al restaurante con éxito.')
      setLinkForm({ restaurant_id: '', amenity_id: '' })
      await fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditAmenity = async (e) => {
    e.preventDefault()
    if (!editingAmenity?.name.trim()) return
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const res = await api(`/amenities/${editingAmenity.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingAmenity.name,
          description: editingAmenity.description,
        }),
      })
      setSuccess(res.message || 'Amenidad actualizada correctamente.')
      setEditingAmenity(null)
      await fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAmenity = async (amenity) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la amenidad "${amenity.name}"? También se removerá de los restaurantes vinculados.`)) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const res = await api(`/amenities/${amenity.id}`, { method: 'DELETE' })
      setSuccess(res?.message || 'Amenidad eliminada correctamente.')
      if (editingAmenity?.id === amenity.id) {
        setEditingAmenity(null)
      }
      setLinkForm((current) => (
        current.amenity_id === amenity.id ? { ...current, amenity_id: '' } : current
      ))
      await fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnlink = async (restaurantId, amenityId) => {
    if (!window.confirm('¿Seguro que deseas remover esta amenidad de este restaurante?')) return

    try {
      const res = await api('/amenities/link', {
        method: 'DELETE',
        body: JSON.stringify({ restaurant_id: restaurantId, amenity_id: amenityId }),
      })
      alert(res?.message || 'Amenidad removida.')
      await fetchData()
    } catch (err) {
      alert(`Error al remover amenidad: ${err.message}`)
    }
  }

  return (
    <>
      <PageHeader
        description="Gestión integral de amenidades y servicios especiales de los locales. Evidencia visual de la relación Muchos a Muchos (N:M) entre restaurantes y amenidades."
        title="Amenidades de Restaurantes (N:M)"
      />

      {error && (
        <p className="mb-6 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600 ring-1 ring-red-500/20">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-6 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 ring-1 ring-emerald-500/20">
          {success}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        
        {/* Formularios de gestión (Columna izquierda) */}
        <div className="space-y-6">
          
          {/* Registrar Amenidad */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-zinc-950 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2">
              ✨ Crear Amenidad
            </h3>
            <form onSubmit={handleCreateAmenity} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nombre de la Amenidad</label>
                <input
                  type="text"
                  placeholder="Ej. WiFi gratis, Pet Friendly"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                  value={newAmenity.name}
                  onChange={(e) => setNewAmenity({ ...newAmenity, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Descripción (Opcional)</label>
                <textarea
                  placeholder="Ej. Red inalámbrica de alta velocidad para clientes..."
                  rows={2}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 resize-none"
                  value={newAmenity.description}
                  onChange={(e) => setNewAmenity({ ...newAmenity, description: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#f15a24] hover:bg-[#e04f1c] py-2.5 text-sm font-semibold text-white transition shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
              >
                Registrar Amenidad
              </button>
            </form>
          </section>

          {/* Editar Amenidad */}
          {editingAmenity && (
            <section className="rounded-2xl border border-orange-200 bg-orange-50/40 p-6 shadow-sm">
              <h3 className="mb-4 border-b border-orange-100 pb-3 text-base font-bold text-zinc-950">
                Editar Amenidad
              </h3>
              <form onSubmit={handleEditAmenity} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nombre de la Amenidad</label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-xl border border-orange-200 bg-white px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                    value={editingAmenity.name}
                    onChange={(e) => setEditingAmenity({ ...editingAmenity, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Descripción (Opcional)</label>
                  <textarea
                    rows={2}
                    className="w-full resize-none rounded-xl border border-orange-200 bg-white px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                    value={editingAmenity.description || ''}
                    onChange={(e) => setEditingAmenity({ ...editingAmenity, description: e.target.value })}
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-[#f15a24] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#e04f1c] hover:shadow-md disabled:opacity-50"
                  >
                    Guardar Cambios
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-650 transition hover:bg-zinc-50"
                    onClick={() => setEditingAmenity(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Asociar Amenidad a Restaurante */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-zinc-950 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2">
              🔗 Asociar a Restaurante (Unión N:M)
            </h3>
            <form onSubmit={handleLink} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Seleccionar Restaurante</label>
                <select
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                  value={linkForm.restaurant_id}
                  onChange={(e) => setLinkForm({ ...linkForm, restaurant_id: e.target.value })}
                >
                  <option value="">-- Elige un restaurante --</option>
                  {restaurants.map((rest) => (
                    <option key={rest.id} value={rest.id}>
                      {rest.name} ({rest.cuisine})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Seleccionar Amenidad</label>
                <select
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                  value={linkForm.amenity_id}
                  onChange={(e) => setLinkForm({ ...linkForm, amenity_id: e.target.value })}
                >
                  <option value="">-- Elige una amenidad --</option>
                  {amenities.map((am) => (
                    <option key={am.id} value={am.id}>
                      {am.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting || !linkForm.restaurant_id || !linkForm.amenity_id}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-750 py-2.5 text-sm font-semibold text-white transition shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
              >
                Vincular Amenidad
              </button>
            </form>
          </section>

          {/* Catálogo de Amenidades */}
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-zinc-950 border-b border-zinc-100 pb-3 mb-4">
              Catálogo de Amenidades ({amenities.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {amenities.map((am) => (
                <div key={am.id} className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-zinc-950">{am.name}</h4>
                      {am.description && <p className="mt-1 text-xs text-zinc-500">{am.description}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-650 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                        onClick={() => {
                          setEditingAmenity({
                            id: am.id,
                            name: am.name,
                            description: am.description || '',
                          })
                          setError('')
                          setSuccess('')
                        }}
                        type="button"
                      >
                        Editar
                      </button>
                      <button
                        className="rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-650 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                        disabled={submitting}
                        onClick={() => handleDeleteAmenity(am)}
                        type="button"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {amenities.length === 0 && (
                <p className="py-8 text-center text-xs text-zinc-400 italic">No hay amenidades registradas.</p>
              )}
            </div>
          </section>

        </div>

        {/* Listas y Relación N:M Activa (Columna derecha) */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm h-fit">
          <h3 className="font-bold text-zinc-950 border-b border-zinc-100 pb-3 mb-4">
            Relación Muchos a Muchos: Amenidades por Restaurante
          </h3>

          {loading ? (
            <div className="py-12 text-center text-sm text-zinc-500">Cargando datos relacionales...</div>
          ) : (
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1">
              {restaurants.map((rest) => (
                <div key={rest.id} className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 space-y-3 hover:shadow-xs transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-zinc-950 text-sm">{rest.name}</h4>
                      <p className="text-xs text-zinc-500">{rest.cuisine} · {rest.address}</p>
                    </div>
                  </div>

                  {/* Listado de amenidades en N:M */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Amenidades activas ({rest.amenities?.length || 0}):</p>
                    {rest.amenities && rest.amenities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {rest.amenities.map((am) => (
                          <div key={am.id} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50/40 px-2.5 py-1 text-xs font-medium text-emerald-850">
                            <span>{am.name}</span>
                            <button
                              onClick={() => handleUnlink(rest.id, am.id)}
                              className="rounded-full p-0.5 text-emerald-500 hover:bg-emerald-100 hover:text-emerald-700 cursor-pointer"
                              title="Remover"
                              type="button"
                            >
                              ❌
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 italic">Este local no tiene amenidades registradas.</p>
                    )}
                  </div>
                </div>
              ))}
              {restaurants.length === 0 && (
                <p className="py-12 text-center text-sm text-zinc-500">No hay restaurantes registrados.</p>
              )}
            </div>
          )}
        </section>

      </div>
    </>
  )
}
