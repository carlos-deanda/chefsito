import { Router } from 'express'
import { validateToken, requireRoles } from '../middleware/auth.js'
import { assertRestaurantAccess } from '../services/staff.js'
import { getDailyAnalytics, getHourlyAnalytics } from '../services/analytics.js'
import { getReportDate } from '../utils/reportDate.js'

const router = Router()

router.get('/:restaurant_id/daily', validateToken, requireRoles('gerente', 'admin', 'soporte'), async (req, res) => {
  const date = req.query.date ?? getReportDate()

  try {
    if (req.user.role !== 'admin' && req.user.role !== 'soporte') {
      const allowed = await assertRestaurantAccess(req.user.id, req.user.role, req.params.restaurant_id)
      if (!allowed) {
        return res.status(403).json({ message: 'Sin acceso a este restaurante' })
      }
    }

    const row = await getDailyAnalytics(req.params.restaurant_id, date)
    return res.json(row)
  } catch (error) {
    console.error('analytics daily', error)
    return res.status(500).json({ message: 'Error al cargar analítica' })
  }
})

router.get('/:restaurant_id/hourly', validateToken, requireRoles('gerente', 'admin'), async (req, res) => {
  const date = req.query.date ?? getReportDate()

  try {
    if (req.user.role !== 'admin') {
      const allowed = await assertRestaurantAccess(req.user.id, req.user.role, req.params.restaurant_id)
      if (!allowed) {
        return res.status(403).json({ message: 'Sin acceso a este restaurante' })
      }
    }

    const hourly = await getHourlyAnalytics(req.params.restaurant_id, date)
    return res.json(hourly)
  } catch (error) {
    console.error('analytics hourly', error)
    return res.status(500).json({ message: 'Error al cargar horas pico' })
  }
})

export default router
