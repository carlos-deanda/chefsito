import { useState } from 'react'
import { IconChevronRight } from './AdminIcons.jsx'
import { getInitials } from './restaurantImages.js'
import { roleLabel } from '../ui.jsx'

export default function StaffList({ users, limit }) {
  const [selectedStaffId, setSelectedStaffId] = useState(null)
  const list = limit ? users.slice(0, limit) : users

  return (
    <ul className="divide-y divide-zinc-100">
      {list.map((u) => (
        <li key={u.id}>
          <button
            className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-zinc-50"
            onClick={() => setSelectedStaffId(selectedStaffId === u.id ? null : u.id)}
            type="button"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50 text-sm font-bold text-violet-700">
              {getInitials(u.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-zinc-950">{u.name}</p>
              <p className="truncate text-sm text-zinc-500">{roleLabel[u.role] ?? u.role}</p>
            </div>
            <span className="flex shrink-0 items-center text-zinc-400">
              <IconChevronRight />
            </span>
          </button>
          {selectedStaffId === u.id && (
            <div className="border-t border-zinc-50 bg-zinc-50/80 px-5 py-3 text-sm text-zinc-600">
              <p><span className="font-medium text-zinc-700">Email:</span> {u.email}</p>
              {u.phone && (
                <p className="mt-1">
                  <span className="font-medium text-zinc-700">Teléfono:</span> {u.phone}
                </p>
              )}
              <p className="mt-1">
                <span className="font-medium text-zinc-700">Estado:</span>{' '}
                {u.is_active ? 'Activo' : 'Inactivo'}
              </p>
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
