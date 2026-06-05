import { useState } from 'react'
import { IconChevronRight } from './AdminIcons.jsx'
import { getInitials } from './restaurantImages.js'
import { roleLabel } from '../ui.jsx'

export default function StaffList({ users, limit, onEdit, onToggleActive }) {
  const [selectedStaffId, setSelectedStaffId] = useState(null)
  const list = limit ? users.slice(0, limit) : users

  return (
    <ul className="divide-y divide-zinc-100">
      {list.map((u) => (
        <li key={u.id}>
          <button
            className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-zinc-50 cursor-pointer"
            onClick={() => setSelectedStaffId(selectedStaffId === u.id ? null : u.id)}
            type="button"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-sm font-bold text-orange-800">
              {getInitials(u.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-zinc-950">{u.name}</p>
              <p className="truncate text-sm text-zinc-505 font-medium">{roleLabel[u.role] ?? u.role}</p>
            </div>
            <span className={`flex shrink-0 items-center text-zinc-400 transition-transform ${selectedStaffId === u.id ? 'rotate-90' : ''}`}>
              <IconChevronRight />
            </span>
          </button>
          {selectedStaffId === u.id && (
            <div className="border-t border-zinc-100 bg-zinc-50/50 px-5 py-4 text-xs text-zinc-600 space-y-2 animate-in slide-in-from-top-1 duration-150">
              <p><span className="font-semibold text-zinc-700">Email:</span> {u.email}</p>
              {u.phone && (
                <p>
                  <span className="font-semibold text-zinc-700">Teléfono:</span> {u.phone}
                </p>
              )}
              <p>
                <span className="font-semibold text-zinc-700">Estado:</span>{' '}
                <span className={`font-bold ${u.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
                  {u.is_active ? 'Activo' : 'Inactivo / Baja'}
                </span>
              </p>
              
              <div className="flex gap-2 pt-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(u)}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-55 transition cursor-pointer"
                    type="button"
                  >
                    ✏️ Editar Datos
                  </button>
                )}
                {onToggleActive && (
                  <button
                    onClick={() => onToggleActive(u.id)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      u.is_active
                        ? 'border-rose-200 bg-rose-50/30 text-rose-650 hover:bg-rose-50/70'
                        : 'border-emerald-200 bg-emerald-50/30 text-emerald-650 hover:bg-emerald-50/70'
                    }`}
                    type="button"
                  >
                    {u.is_active ? '🚫 Dar de Baja' : '✅ Reactivar'}
                  </button>
                )}
              </div>
            </div>
          )}
        </li>
      ))}
      {list.length === 0 && (
        <li className="px-5 py-8 text-center text-sm text-zinc-500">No hay personal registrado</li>
      )}
    </ul>
  )
}
