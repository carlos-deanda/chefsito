import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { AppShell, MetricCard } from '../components/ui.jsx'
import { io as socketIO } from 'socket.io-client'

const statusOptions = [
  { value: 'open', label: 'Abierto' },
  { value: 'closed', label: 'Cerrado' },
]

export function EmptyQueueState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200/60 bg-linear-to-b from-zinc-50 to-white p-12 text-center shadow-xs">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 ring-8 ring-orange-50/50 animate-pulse">
        <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.472 3.472 0 011.839 1.839 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.472 3.472 0 01-1.839-1.839z" />
        </svg>
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
        </span>
      </div>
      <h3 className="mt-6 text-xl font-bold text-zinc-900">¡Todo al día!</h3>
      <p className="mt-2 max-w-sm text-sm text-zinc-550 leading-relaxed">
        No hay comensales esperando en la fila en este momento. Las mesas de tu local están fluyendo libremente.
      </p>
      <div className="mt-6 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-750 ring-1 ring-emerald-250/50 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Servicio activo y fluido
      </div>
    </div>
  )
}

function GerenteExtras({ restaurant, onStatusChange, analytics }) {
  return (
  <>
    <div className="mb-6 flex flex-wrap items-center gap-3">
      {statusOptions.map((opt) => {
        const isActive = restaurant.status === opt.value
        const buttonClass = opt.value === 'open'
          ? isActive
            ? 'bg-emerald-600 border border-emerald-700 text-white shadow-md shadow-emerald-500/25 scale-102 font-bold cursor-pointer transition flex items-center gap-2'
            : 'border border-zinc-200 text-zinc-650 bg-white hover:bg-emerald-50 hover:text-emerald-750 hover:border-emerald-200 font-semibold cursor-pointer transition flex items-center gap-2'
          : isActive
            ? 'bg-rose-600 border border-rose-700 text-white shadow-md shadow-rose-500/25 scale-102 font-bold cursor-pointer transition flex items-center gap-2'
            : 'border border-zinc-200 text-zinc-650 bg-white hover:bg-rose-50 hover:text-rose-750 hover:border-rose-200 font-semibold cursor-pointer transition flex items-center gap-2'

        const dotElement = opt.value === 'open'
          ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isActive ? 'bg-emerald-300' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isActive ? 'bg-white' : 'bg-emerald-500'}`}></span>
            </span>
          )
          : (
            <span className="relative flex h-2.5 w-2.5">
              {isActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isActive ? 'bg-white' : 'bg-rose-500'}`}></span>
            </span>
          )

        return (
          <button
            key={opt.value}
            className={`rounded-xl px-5 py-2.5 text-sm ${buttonClass}`}
            onClick={() => onStatusChange(opt.value)}
            type="button"
          >
            {dotElement}
            {opt.label}
          </button>
        )
      })}
    </div>

    {analytics && (
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <MetricCard label="Turnos hoy" value={analytics.total_entries} />
        <MetricCard label="No-shows" value={analytics.no_shows} />
        <MetricCard label="Espera promedio" value={`${analytics.avg_wait_minutes} min`} />
        <MetricCard label="Hora pico" value={analytics.peak_hour != null ? `${analytics.peak_hour}:00` : '—'} />
      </div>
    )}
  </>
  )
}

export default function GerenteDashboard({ user, onLogout }) {
  const [restaurant, setRestaurant] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [waitlist, setWaitlist] = useState([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const assigned = await api('/restaurants/my-assigned')
      const r = assigned.restaurant
      setRestaurant(r)
      const [queue, stats] = await Promise.all([
        api(`/restaurants/${r.id}/waitlist`),
        api(`/analytics/${r.id}/daily`),
      ])
      setWaitlist(queue.waitlist)
      setAnalytics(stats)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load()

    const socket = socketIO(import.meta.env.VITE_API_URL ?? 'http://localhost:4000')

    socket.on('waitlist:changed', (data) => {
      console.log('Socket event waitlist:changed received in Manager Dashboard', data)
      load()
    })

    const interval = setInterval(load, 5000)

    return () => {
      clearInterval(interval)
      socket.disconnect()
    }
  }, [load])

  async function updateStatus(status) {
    try {
      await api(`/restaurants/${restaurant.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function callGuest(entryId) {
    await api(`/waitlist/${entryId}/call`, { method: 'POST' })
    await load()
  }

  async function arriveGuest(entryId) {
    await api(`/waitlist/${entryId}/arrive`, { method: 'POST' })
    await load()
  }

  async function removeGuest(entryId) {
    await api(`/waitlist/${entryId}/remove`, { method: 'DELETE' })
    await load()
  }

  if (!restaurant) {
    return (
      <AppShell onLogout={onLogout} subtitle="Gerente" title="Gerente" user={user}>
        <p className="text-sm text-zinc-500">{error || 'Cargando restaurante…'}</p>
      </AppShell>
    )
  }

  return (
    <AppShell onLogout={onLogout} subtitle={restaurant.name} title="Gerente" user={user}>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <GerenteExtras analytics={analytics} onStatusChange={updateStatus} restaurant={restaurant} />

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="border-b border-zinc-200 pb-4 mb-4">
          <h2 className="text-lg font-bold text-zinc-950">Fila de espera activa (Total: {waitlist.length} personas)</h2>
        </div>

        {waitlist.length === 0 ? (
          <EmptyQueueState />
        ) : (
          <div className="relative border-l-2 border-zinc-200 pl-6 ml-4 space-y-6 my-4">
            {waitlist.map((entry) => {
              const isCalled = entry.status === 'called'
              return (
                <div key={entry.id} className="relative">
                  {/* Queue timeline circle */}
                  <span className={`absolute -left-[35px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ring-4 ring-white ${
                    isCalled
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : entry.position === 1
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'bg-zinc-200 text-zinc-700'
                  }`}>
                    {entry.position}
                  </span>

                  {/* Client Card */}
                  <div className={`rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-md ${
                    isCalled ? 'border-emerald-200 bg-emerald-50/20' : 'border-zinc-200'
                  }`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-zinc-950 text-base">{entry.guest_name}</h4>
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isCalled 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {isCalled ? 'Llamado' : 'En espera'}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500">
                          <span className="flex items-center gap-1.5">
                            <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {entry.party_size} personas
                          </span>
                          <span className="flex items-center gap-1.5">
                            <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Esperando hace {entry.wait_minutes ?? '0'} min
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                        {!isCalled && (
                          <button
                            className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition"
                            onClick={() => callGuest(entry.id)}
                            type="button"
                          >
                            Llamar
                          </button>
                        )}
                        <button
                          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                          onClick={() => arriveGuest(entry.id)}
                          type="button"
                        >
                          Liberar
                        </button>
                        <button
                          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition"
                          onClick={() => removeGuest(entry.id)}
                          type="button"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* SECCIÓN DE NOVEDADES DEL RESTAURANTE */}
      <GerentePublicacionesSection user={user} />
    </AppShell>
  )
}

export function GerentePublicacionesSection({ user }) {
  const [publicaciones, setPublicaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingPost, setEditingPost] = useState(null)

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const res = await api('/publicaciones')
      // Filtrar para mostrar solo las del propio gerente
      const mine = (res.publicaciones || []).filter((p) => p.user_id === user.id)
      setPublicaciones(mine)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const res = await api('/publicaciones', {
        method: 'POST',
        body: JSON.stringify({ title, content }),
      })
      setSuccess(res.message || 'Anuncio publicado.')
      setTitle('')
      setContent('')
      await fetchPosts()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    if (!editingPost.title.trim() || !editingPost.content.trim()) return
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const res = await api(`/publicaciones/${editingPost.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: editingPost.title, content: editingPost.content }),
      })
      setSuccess(res.message || 'Anuncio actualizado.')
      setEditingPost(null)
      await fetchPosts()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (postId) => {
    if (!window.confirm('¿Deseas eliminar este anuncio?')) return
    try {
      await api(`/publicaciones/${postId}`, { method: 'DELETE' })
      alert('Anuncio eliminado.')
      await fetchPosts()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="grid gap-6 mt-6 lg:grid-cols-[0.8fr_1.2fr]">
      {/* Crear Publicación */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-zinc-950 border-b border-zinc-100 pb-3 mb-4">
          📢 Publicar Novedad de la Sucursal
        </h3>
        <form onSubmit={handleCreate} className="space-y-4">
          {error && !editingPost && <p className="text-xs text-red-650 bg-red-50 p-2.5 rounded-xl border border-red-100">{error}</p>}
          {success && !editingPost && <p className="text-xs text-emerald-650 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">{success}</p>}
          
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Título del Anuncio</label>
            <input
              type="text"
              required
              placeholder="Ej. ¡Chilaquiles gratis en tu cumpleaños!"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Contenido</label>
            <textarea
              required
              rows={4}
              placeholder="Detalla la promoción o aviso para los clientes..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#f15a24] hover:bg-[#e04f1c] py-2.5 text-sm font-semibold text-white transition shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Publicando...' : 'Publicar'}
          </button>
        </form>
      </div>

      {/* Historial de Publicaciones del Gerente */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-bold text-zinc-950 border-b border-zinc-100 pb-3">
          Tus Anuncios Activos ({publicaciones.length})
        </h3>
        
        {loading ? (
          <p className="py-8 text-center text-xs text-zinc-500">Cargando anuncios...</p>
        ) : (
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {publicaciones.map((p) => (
              <div key={p.id} className="relative rounded-xl border border-zinc-100 bg-zinc-55/30 p-4">
                <div className="absolute right-3 top-3 flex gap-1">
                  <button
                    onClick={() => {
                      setEditingPost({ ...p })
                      setError('')
                      setSuccess('')
                    }}
                    className="rounded-lg p-1 hover:bg-zinc-100 text-zinc-650 cursor-pointer text-xs"
                    type="button"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="rounded-lg p-1 hover:bg-red-50 text-red-500 cursor-pointer text-xs"
                    type="button"
                  >
                    🗑️
                  </button>
                </div>
                <h4 className="font-bold text-zinc-950 pr-12 text-sm">{p.title}</h4>
                <p className="text-[10px] text-zinc-400 font-medium mt-0.5">{new Date(p.created_at).toLocaleDateString()}</p>
                <p className="mt-2 text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap">{p.content}</p>
              </div>
            ))}
            {publicaciones.length === 0 && (
              <p className="py-12 text-center text-xs text-zinc-400 italic">No has publicado ningún anuncio aún.</p>
            )}
          </div>
        )}
      </div>

      {/* Modal de edición */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <h3 className="text-lg font-bold text-zinc-950">Editar Anuncio</h3>
              <button
                onClick={() => setEditingPost(null)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 cursor-pointer"
                type="button"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEdit} className="mt-4 space-y-4">
              {error && <p className="text-xs text-red-650 bg-red-55 p-2 rounded-lg">{error}</p>}
              {success && <p className="text-xs text-emerald-650 bg-emerald-55 p-2 rounded-lg">{success}</p>}
              
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Título</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                  value={editingPost.title || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Contenido</label>
                <textarea
                  required
                  rows={4}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 resize-none"
                  value={editingPost.content || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
                <button
                  onClick={() => setEditingPost(null)}
                  type="button"
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-650 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-[#f15a24] hover:bg-[#e04f1c] px-4 py-2 text-sm font-semibold text-white cursor-pointer"
                >
                  {submitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
