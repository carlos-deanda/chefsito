import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { AppShell } from '../components/ui.jsx'

export default function SoporteDashboard({ user, onLogout }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/soporte/overview')
      .then(setData)
      .catch((err) => setError(err.message))
  }, [])

  return (
    <AppShell
      onLogout={onLogout}
      subtitle="Vista de solo lectura para asistencia"
      title="Soporte"
      user={user}
    >
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {data && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 p-4">
              <h2 className="font-semibold">Restaurantes</h2>
            </div>
            <ul className="divide-y divide-zinc-100">
              {data.restaurants.map((r) => (
                <li key={r.id} className="flex justify-between p-4 text-sm">
                  <span className="font-medium">{r.name}</span>
                  <span className="capitalize text-zinc-500">{r.status}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 p-4">
              <h2 className="font-semibold">Fila activa</h2>
            </div>
            <ul className="divide-y divide-zinc-100">
              {data.active_waitlist.length === 0 ? (
                <li className="p-4 text-sm text-zinc-500">Sin turnos activos</li>
              ) : (
                data.active_waitlist.map((w) => (
                  <li key={w.id} className="p-4 text-sm">
                    <p className="font-medium">{w.guest_name} · {w.restaurant_name}</p>
                    <p className="text-zinc-500">#{w.position} · {w.status}</p>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-lg border border-zinc-200 bg-white shadow-sm lg:col-span-2">
            <div className="border-b border-zinc-200 p-4">
              <h2 className="font-semibold">Notificaciones recientes</h2>
            </div>
            <ul className="divide-y divide-zinc-100">
              {data.recent_notifications.map((n) => (
                <li key={n.id} className="p-4 text-sm">
                  <p className="font-medium">{n.user_email} · {n.channel}</p>
                  <p className="text-zinc-600">{n.message}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </AppShell>
  )
}
