import { useState, useEffect } from 'react'
import { api } from '../../../api/client.js'
import PageHeader from '../PageHeader.jsx'

export default function AdminPublicacionesPage() {
  const [publicaciones, setPublicaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Modal states
  const [editingPost, setEditingPost] = useState(null)
  const [newPost, setNewPost] = useState({ title: '', content: '' })
  const [saving, setSaving] = useState(false)

  const fetchPublicaciones = async () => {
    setLoading(true)
    try {
      const res = await api('/publicaciones')
      setPublicaciones(res.publicaciones || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPublicaciones()
  }, [])

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!newPost.title.trim() || !newPost.content.trim()) return
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await api('/publicaciones', {
        method: 'POST',
        body: JSON.stringify(newPost),
      })
      setSuccess(res.message || 'Anuncio publicado exitosamente.')
      setNewPost({ title: '', content: '' })
      await fetchPublicaciones()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editingPost.title.trim() || !editingPost.content.trim()) return
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await api(`/publicaciones/${editingPost.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editingPost.title,
          content: editingPost.content,
        }),
      })
      setSuccess(res.message || 'Anuncio actualizado con éxito.')
      setEditingPost(null)
      await fetchPublicaciones()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = async (postId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este anuncio?')) return

    try {
      await api(`/publicaciones/${postId}`, { method: 'DELETE' })
      alert('Anuncio eliminado correctamente.')
      await fetchPublicaciones()
    } catch (err) {
      alert(`Error al eliminar anuncio: ${err.message}`)
    }
  }

  return (
    <>
      <PageHeader
        description="Publica novedades y avisos en la cartelera general o edita publicaciones existentes."
        title="Anuncios y Novedades (Relación 1:N)"
      />

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        {/* Columna de Creación */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm h-fit">
          <h3 className="text-base font-bold text-zinc-950 border-b border-zinc-100 pb-3 mb-4">
            📢 Publicar Nuevo Anuncio
          </h3>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {error && !editingPost && (
              <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-600 ring-1 ring-red-500/20">
                {error}
              </p>
            )}
            {success && !editingPost && (
              <p className="rounded-xl bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-500/20">
                {success}
              </p>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Título</label>
              <input
                type="text"
                placeholder="Título del anuncio"
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Contenido</label>
              <textarea
                placeholder="Escribe el cuerpo del mensaje..."
                rows={5}
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 resize-none"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-[#f15a24] hover:bg-[#e04f1c] py-2.5 text-sm font-semibold text-white transition shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Publicando...' : 'Publicar Anuncio'}
            </button>
          </form>
        </section>

        {/* Columna de Listado y Gestión */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-bold text-zinc-950 border-b border-zinc-100 pb-3">
            Historial de Publicaciones ({publicaciones.length})
          </h3>

          {loading ? (
            <div className="py-12 text-center text-sm text-zinc-500">Cargando anuncios...</div>
          ) : (
            <div className="max-h-[calc(100vh-16rem)] space-y-4 overflow-y-auto pr-1">
              {publicaciones.map((p) => (
                <article key={p.id} className="relative rounded-2xl border border-zinc-100 bg-zinc-50/30 p-5 hover:shadow-xs transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 pr-16">
                      <h4 className="font-bold text-zinc-950 text-base">{p.title}</h4>
                      <p className="text-xs text-zinc-400 font-medium">
                        Publicado el {new Date(p.created_at).toLocaleString()}
                      </p>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="absolute right-4 top-4 flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingPost({ ...p })}
                        className="rounded-lg p-1 hover:bg-zinc-100 text-zinc-650 cursor-pointer"
                        title="Editar"
                        type="button"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteClick(p.id)}
                        className="rounded-lg p-1 hover:bg-red-50 text-red-500 cursor-pointer"
                        title="Eliminar"
                        type="button"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{p.content}</p>
                  
                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-zinc-500">
                    <span>Autor: <span className="text-zinc-750 font-bold">{p.author_name}</span></span>
                    <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-violet-700 ring-1 ring-violet-200/50 capitalize text-[10px]">
                      {p.author_role}
                    </span>
                  </div>
                </article>
              ))}

              {publicaciones.length === 0 && (
                <p className="py-12 text-center text-sm text-zinc-500">
                  No hay anuncios registrados. Publica el primero a la izquierda.
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Modal de edición */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <h3 className="text-lg font-bold text-zinc-950">Editar Anuncio</h3>
              <button
                onClick={() => setEditingPost(null)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 cursor-pointer"
                type="button"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              {error && editingPost && (
                <p className="rounded-xl bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-600 ring-1 ring-red-500/20">
                  {error}
                </p>
              )}
              {success && editingPost && (
                <p className="rounded-xl bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-500/20">
                  {success}
                </p>
              )}

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
                  rows={5}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100 resize-none"
                  value={editingPost.content || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-4">
                <button
                  onClick={() => setEditingPost(null)}
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
