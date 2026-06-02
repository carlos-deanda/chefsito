import { Router } from 'express'
import { query } from '../db/pool.js'
import { validateToken, requireRoles } from '../middleware/auth.js'
import { assertRestaurantAccess } from '../services/staff.js'

const router = Router()

router.get('/:restaurant_id/daily', validateToken, requireRoles('gerente', 'admin', 'soporte'), async (req, res) => {
  const date = req.query.date ?? new Date().toISOString().slice(0, 10)

  try {
    if (req.user.role !== 'admin' && req.user.role !== 'soporte') {
      const allowed = await assertRestaurantAccess(req.user.id, req.user.role, req.params.restaurant_id)
      if (!allowed) {
        return res.status(403).json({ message: 'Sin acceso a este restaurante' })
      }
    }

    const result = await query(
      `SELECT restaurant_id, report_date, total_entries, no_shows, avg_wait_minutes, peak_hour
       FROM daily_analytics
       WHERE restaurant_id = $1 AND report_date = $2::date`,
      [req.params.restaurant_id, date],
    )

    const row = result.rows[0]

    if (!row) {
      return res.json({
        restaurant_id: req.params.restaurant_id,
        date,
        total_entries: 0,
        no_shows: 0,
        avg_wait_minutes: 0,
        peak_hour: null,
      })
    }

    return res.json(row)
  } catch (error) {
    console.error('analytics daily', error)
    return res.status(500).json({ message: 'Error al cargar analítica' })
  }
})

router.get('/:restaurant_id/hourly', validateToken, requireRoles('gerente', 'admin'), async (req, res) => {
  const date = req.query.date ?? new Date().toISOString().slice(0, 10)

  try {
    if (req.user.role !== 'admin') {
      const allowed = await assertRestaurantAccess(req.user.id, req.user.role, req.params.restaurant_id)
      if (!allowed) {
        return res.status(403).json({ message: 'Sin acceso a este restaurante' })
      }
    }

    const result = await query(
      `SELECT hour, entries FROM hourly_analytics
       WHERE restaurant_id = $1 AND report_date = $2::date
       ORDER BY hour`,
      [req.params.restaurant_id, date],
    )

    return res.json({ hours: result.rows })
  } catch (error) {
    console.error('analytics hourly', error)
    return res.status(500).json({ message: 'Error al cargar horas pico' })
  }
})

export default router
