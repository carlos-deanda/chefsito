import { Router } from 'express'
import { query } from '../db/pool.js'
import { validateToken, requireRoles } from '../middleware/auth.js'
import { assertRestaurantAccess, getStaffRestaurantId } from '../services/staff.js'

const router = Router()

router.get('/nearby', validateToken, requireRoles('usuario'), async (_req, res) => {
  try {
    const result = await query(`SELECT * FROM v_restaurants_public ORDER BY name`)
    return res.json({ restaurants: result.rows })
  } catch (error) {
    console.error('nearby', error)
    return res.status(500).json({ message: 'Error al cargar restaurantes' })
  }
})

router.get('/my-assigned', validateToken, requireRoles('recepcionista', 'gerente'), async (req, res) => {
  try {
    const restaurantId = await getStaffRestaurantId(req.user.id, req.user.role)

    if (!restaurantId) {
      return res.status(404).json({ message: 'No tienes un restaurante asignado' })
    }

    const result = await query(
      `SELECT r.*,
              (SELECT COUNT(*)::INT FROM waitlist_entries w
               WHERE w.restaurant_id = r.id AND w.status IN ('waiting', 'called')) AS people_waiting
       FROM restaurants r
       WHERE r.id = $1`,
      [restaurantId],
    )

    return res.json({ restaurant: result.rows[0] })
  } catch (error) {
    console.error('my-assigned', error)
    return res.status(500).json({ message: 'Error al cargar restaurante' })
  }
})

router.get('/:id/waitlist', validateToken, requireRoles('recepcionista', 'gerente', 'admin'), async (req, res) => {
  try {
    const allowed = await assertRestaurantAccess(req.user.id, req.user.role, req.params.id)

    if (!allowed) {
      return res.status(403).json({ message: 'Sin acceso a este restaurante' })
    }

    const result = await query(
      `SELECT id, restaurant_id, user_id, guest_name, party_size, status, position,
              registered_at, called_at, ROUND(wait_minutes)::INT AS wait_minutes
       FROM v_waitlist_active
       WHERE restaurant_id = $1`,
      [req.params.id],
    )

    return res.json({ restaurant_id: req.params.id, waitlist: result.rows })
  } catch (error) {
    console.error('waitlist', error)
    return res.status(500).json({ message: 'Error al cargar fila' })
  }
})

router.put('/:id/status', validateToken, requireRoles('gerente', 'admin'), async (req, res) => {
  const { status } = req.body

  if (!['open', 'paused', 'closed'].includes(status)) {
    return res.status(400).json({ message: 'Estado inválido' })
  }

  try {
    const allowed = await assertRestaurantAccess(req.user.id, req.user.role, req.params.id)

    if (!allowed) {
      return res.status(403).json({ message: 'Sin acceso a este restaurante' })
    }

    const result = await query(
      `UPDATE restaurants SET status = $1::restaurant_status WHERE id = $2
       RETURNING id, name, status, estimated_wait_minutes`,
      [status, req.params.id],
    )

    return res.json(result.rows[0])
  } catch (error) {
    console.error('status', error)
    return res.status(500).json({ message: 'Error al actualizar estado' })
  }
})

export default router
