import { useState } from 'react'
import { api } from '../../../api/client.js'
import CreateStaffForm from '../../CreateStaffForm.jsx'
import StaffList from '../StaffList.jsx'
import PageHeader from '../PageHeader.jsx'

export default function AdminStaffPage({ users, restaurants, onCreated }) {
  const [editingUser, setEditingUser] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleEditClick = (user) => {
    setEditingUser({ ...user })
    setError('')
    setSuccess('')
  }

  const handleToggleActiveClick = async (userId) => {
    try {
      const res = await api(`/admin/users/${userId}/toggle-active`, { method: 'PUT' })
      alert(res?.message || 'Estado del usuario actualizado.')
      onCreated() // Refrescar lista
    } catch (err) {
      alert(`Error al actualizar estado: ${err.message}`)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await api(`/admin/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          phone: editingUser.phone,
          role: editingUser.role,
        }),
      })

      setSuccess(res.message || 'Usuario actualizado correctamente.')
      setTimeout(() => {
        setEditingUser(null)
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
        description="Registra cuentas de recepcionistas, gerentes, soporte o edita sus datos."
        title="Personal (Staff)"
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <CreateStaffForm onCreated={onCreated} restaurants={restaurants} />
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h3 className="font-semibold text-zinc-950">
              Personal del sistema ({users.length})
            </h3>
          </div>
          <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
            <StaffList
              users={users}
              onEdit={handleEditClick}
              onToggleActive={handleToggleActiveClick}
            />
          </div>
        </section>
      </div>

      {/* Modal de edición */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <h3 className="text-lg font-bold text-zinc-950">Editar Datos de Personal</h3>
              <button
                onClick={() => setEditingUser(null)}
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
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nombre Completo</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Teléfono (Celular)</label>
                <input
                  type="tel"
                  placeholder="+52..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Rol del Sistema</label>
                <select
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                  value={editingUser.role || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <option value="admin">Administrador</option>
                  <option value="gerente">Gerente de Local</option>
                  <option value="recepcionista">Recepcionista</option>
                  <option value="soporte">Soporte Técnico</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-zinc-100 pt-4">
                <button
                  onClick={() => setEditingUser(null)}
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
