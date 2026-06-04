import { query } from '../db/pool.js'
import { REPORT_TIMEZONE } from '../utils/reportDate.js'

const TZ = REPORT_TIMEZONE

/**
 * Métricas calculadas en vivo desde waitlist_entries.
 * Las fechas usan zona horaria de México para coincidir con el día local del negocio.
 */
export async function getDailyAnalytics(restaurantId, date) {
  const daily = await query(
    `SELECT
       COUNT(*)::INT AS total_entries,
       COUNT(*) FILTER (WHERE status = 'no_show')::INT AS no_shows,
       COALESCE(
         ROUND(
           AVG(
             EXTRACT(EPOCH FROM (COALESCE(arrived_at, called_at) - registered_at)) / 60
           ) FILTER (WHERE arrived_at IS NOT NULL OR called_at IS NOT NULL)
         ),
         0
       )::INT AS avg_wait_minutes
     FROM waitlist_entries
     WHERE restaurant_id = $1
       AND (registered_at AT TIME ZONE '${TZ}')::date = $2::date`,
    [restaurantId, date],
  )

  const peak = await query(
    `SELECT
       EXTRACT(HOUR FROM registered_at AT TIME ZONE '${TZ}')::INT AS hour,
       COUNT(*)::INT AS entries
     FROM waitlist_entries
     WHERE restaurant_id = $1
       AND (registered_at AT TIME ZONE '${TZ}')::date = $2::date
     GROUP BY 1
     ORDER BY entries DESC, hour ASC
     LIMIT 1`,
    [restaurantId, date],
  )

  const row = daily.rows[0]
  const peakRow = peak.rows[0]

  return {
    restaurant_id: restaurantId,
    report_date: date,
    date,
    total_entries: row?.total_entries ?? 0,
    no_shows: row?.no_shows ?? 0,
    avg_wait_minutes: row?.avg_wait_minutes ?? 0,
    peak_hour: peakRow?.hour ?? null,
  }
}

export async function getHourlyAnalytics(restaurantId, date) {
  const result = await query(
    `SELECT
       EXTRACT(HOUR FROM registered_at AT TIME ZONE '${TZ}')::SMALLINT AS hour,
       COUNT(*)::INT AS entries
     FROM waitlist_entries
     WHERE restaurant_id = $1
       AND (registered_at AT TIME ZONE '${TZ}')::date = $2::date
     GROUP BY 1
     ORDER BY 1`,
    [restaurantId, date],
  )

  return { hours: result.rows }
}
