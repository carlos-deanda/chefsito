import { useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { AppShell } from '../components/ui.jsx'
import { io as socketIO } from 'socket.io-client'

export default function SoporteDashboard({ user, onLogout }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const loadData = () => {
    api('/soporte/overview')
      .then(setData)
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    loadData()

    const socket = socketIO(import.meta.env.VITE_API_URL ?? 'http://localhost:4000')

    socket.on('restaurant:status_changed', (data) => {
      console.log('Socket event: restaurant:status_changed in Support Dashboard', data)
      loadData()
    })

    socket.on('waitlist:changed', (data) => {
      console.log('Socket event: waitlist:changed in Support Dashboard', data)
      loadData()
    })

    // Auto refresh fallback
    const interval = setInterval(loadData, 5000)

    return () => {
      clearInterval(interval)
      socket.disconnect()
    }
  }, [])

  return (
    <AppShell
      onLogout={onLogout}
      subtitle="Vista de monitoreo global y asistencia en tiempo real"
      title="Soporte Técnico"
      user={user}
    >
      {error && (
        <p className="mb-6 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600 ring-1 ring-red-500/20">
          {error}
        </p>
      )}

      {/* Banner de Bienvenida y Status del Sistema */}
      <section className="mb-6 overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-r from-violet-950 via-indigo-900 to-zinc-900 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">Consola del Operador</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Centro de Soporte Chefsito</h2>
            <p className="mt-2 text-sm text-zinc-300">
              Monitoreo y auditoría de la plataforma. Solo lectura para soporte y asistencia global.
            </p>
          </div>
          
          <div className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
            </span>
            <div className="text-left">
              <p className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Estado de Red</p>
              <p className="text-sm font-bold text-emerald-400">Operativo · Live</p>
            </div>
          </div>
        </div>
      </section>

      {data && (
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* COLUMNA 1: RESTAURANTES */}
          <section className="flex flex-col rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-zinc-100 bg-zinc-50/50 px-5 py-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Restaurantes afiliados
                </h3>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-600">
                  {data.restaurants.length}
                </span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 p-2 max-h-[500px]">
              {data.restaurants.map((r) => {
                const statusColor = r.status === 'open' ? 'emerald' : 'zinc'
                return (
                  <div key={r.id} className="flex items-center justify-between p-3.5 hover:bg-zinc-50/50 rounded-xl transition">
                    <div className="flex items-center gap-3">
                      <span className={`inline-block h-2 w-2 rounded-full bg-${statusColor}-500 ${r.status === 'open' ? 'animate-pulse' : ''}`} />
                      <span className="font-semibold text-zinc-950 text-sm">{r.name}</span>
                    </div>
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      r.status === 'open' 
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' 
                        : 'bg-zinc-100 text-zinc-655 ring-1 ring-zinc-200'
                    }`}>
                      {r.status === 'open' ? 'Abierto' : 'Cerrado'}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* COLUMNA 2: FILA ACTIVA GLOBAL */}
          <section className="flex flex-col rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-zinc-100 bg-zinc-50/50 px-5 py-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Monitoreo de filas
                </h3>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                  {data.active_waitlist.length} activos
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 p-2 max-h-[500px]">
              {data.active_waitlist.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 text-sm">Sin turnos activos en la plataforma</div>
              ) : (
                data.active_waitlist.map((w) => (
                  <div key={w.id} className="p-3.5 hover:bg-zinc-50/50 rounded-xl transition space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-zinc-950 text-sm">{w.guest_name}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
                        w.status === 'called' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {w.status === 'called' ? 'Llamado' : `Posición #${w.position}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>{w.restaurant_name}</span>
                      <span className="capitalize text-[10px]">{w.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* COLUMNA 3: NOTIFICACIONES RECIENTES */}
          <section className="flex flex-col rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-zinc-100 bg-zinc-50/50 px-5 py-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Bitácora de notificaciones
                </h3>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-600">
                  Live log
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 p-2 max-h-[500px]">
              {data.recent_notifications.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 text-sm">No hay notificaciones registradas</div>
              ) : (
                data.recent_notifications.map((n) => {
                  const channelColors = {
                    whatsapp: 'bg-emerald-50 text-emerald-800 border-emerald-100',
                    sms: 'bg-indigo-50 text-indigo-800 border-indigo-100',
                    push: 'bg-amber-50 text-amber-800 border-amber-100',
                    email: 'bg-violet-50 text-violet-800 border-violet-100',
                  }
                  const channelLabel = {
                    whatsapp: 'WhatsApp',
                    sms: 'SMS',
                    push: 'Push',
                    email: 'Email',
                  }
                  return (
                    <div key={n.id} className="p-3.5 hover:bg-zinc-50/50 rounded-xl transition space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-800 truncate">{n.user_email}</p>
                          <p className="text-[10px] text-zinc-400">{new Date(n.sent_at).toLocaleTimeString()}</p>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold border ${channelColors[n.channel] ?? 'bg-zinc-50'}`}>
                            {channelLabel[n.channel] ?? n.channel}
                          </span>
                          <span className={`h-1.5 w-1.5 rounded-full ${n.status === 'sent' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        </div>
                      </div>
                      <div className="rounded-lg bg-zinc-50 p-2 text-xs text-zinc-600 font-mono leading-relaxed border border-zinc-100 break-words">
                        {n.message}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>

        </div>
      )}
    </AppShell>
  )
}
