import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'
import { AppShell, MetricCard } from '../components/ui.jsx'
import { EmptyQueueState } from './GerenteDashboard.jsx'
import { io as socketIO } from 'socket.io-client'

export default function StaffWaitlistDashboard({ user, onLogout, roleTitle }) {
  const [restaurant, setRestaurant] = useState(null)
  const [waitlist, setWaitlist] = useState([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const assigned = await api('/restaurants/my-assigned')
      setRestaurant(assigned.restaurant)
      const queue = await api(`/restaurants/${assigned.restaurant.id}/waitlist`)
      setWaitlist(queue.waitlist)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load()
    
    const socket = socketIO(import.meta.env.VITE_API_URL ?? 'http://localhost:4000')
    
    socket.on('waitlist:changed', (data) => {
      console.log('Socket event waitlist:changed received in Staff Dashboard', data)
      load()
    })

    const interval = setInterval(load, 5000)
    
    return () => {
      clearInterval(interval)
      socket.disconnect()
    }
  }, [load])

  async function callGuest(entryId) {
    try {
      await api(`/waitlist/${entryId}/call`, { method: 'POST' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function arriveGuest(entryId) {
    try {
      await api(`/waitlist/${entryId}/arrive`, { method: 'POST' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function removeGuest(entryId) {
    try {
      await api(`/waitlist/${entryId}/remove`, { method: 'DELETE' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const waitTimePerPerson = restaurant ? Math.max(5, Math.round((restaurant.estimated_wait_minutes || 15) / 3)) : 0
  const dynamicWaitTime = restaurant ? (waitlist.length + 1) * waitTimePerPerson : 0

  return (
    <AppShell onLogout={onLogout} subtitle={restaurant?.name ?? 'Cargando…'} title={roleTitle} user={user}>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {restaurant && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <MetricCard label="En fila" value={waitlist.length} />
            <MetricCard label="Espera estimada (Próximo)" value={`${dynamicWaitTime} min`} />
            <MetricCard label="Estado local" value={restaurant.status === 'open' ? 'Abierto' : 'Cerrado'} />
          </div>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="border-b border-zinc-200 pb-4 mb-4">
              <h2 className="text-lg font-bold text-zinc-950">Fila de espera activa</h2>
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
        </>
      )}
    </AppShell>
  )
}
