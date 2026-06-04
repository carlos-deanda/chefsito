export default function HourlyChart({ hours = [] }) {
  if (hours.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 text-sm text-zinc-500">
        Sin registros por hora para hoy
      </div>
    )
  }

  const maxEntries = Math.max(...hours.map((h) => h.entries), 1)
  const peakHour = hours.reduce(
    (best, row) => (row.entries > best.entries ? row : best),
    hours[0],
  )

  return (
    <div>
      <div className="flex h-52 items-end gap-1.5 sm:gap-2">
        {hours.map((row) => {
          const height = Math.max(8, (row.entries / maxEntries) * 100)
          const isPeak = row.hour === peakHour.hour
          return (
            <div key={row.hour} className="group flex flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-semibold text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100 sm:text-xs">
                {row.entries}
              </span>
              <div className="flex h-40 w-full items-end justify-center">
                <div
                  className={`w-full max-w-8 rounded-t-lg transition-all ${
                    isPeak
                      ? 'bg-gradient-to-t from-orange-600 to-orange-400 shadow-md shadow-orange-200'
                      : 'bg-gradient-to-t from-violet-300 to-violet-200 group-hover:from-violet-400 group-hover:to-violet-300'
                  }`}
                  style={{ height: `${height}%` }}
                  title={`${row.hour}:00 — ${row.entries} turnos`}
                />
              </div>
              <span
                className={`text-[10px] font-medium sm:text-xs ${
                  isPeak ? 'font-bold text-orange-600' : 'text-zinc-500'
                }`}
              >
                {row.hour}h
              </span>
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-center text-xs text-zinc-500">
        Hora pico: <span className="font-semibold text-orange-600">{peakHour.hour}:00</span>
        {' '}({peakHour.entries} turnos)
      </p>
    </div>
  )
}
