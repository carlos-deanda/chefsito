import { Router } from 'express'
import { query } from '../db/pool.js'
import { validateToken, requireRoles } from '../middleware/auth.js'

const router = Router()

router.use(validateToken, requireRoles('soporte', 'admin'))

router.get('/overview', async (_req, res) => {
  try {
    const [restaurants, active, notifications] = await Promise.all([
      query(`SELECT id, name, status FROM restaurants ORDER BY name`),
      query(
        `SELECT w.id, w.status, w.position, u.name AS guest_name, r.name AS restaurant_name
         FROM waitlist_entries w
         JOIN users u ON u.id = w.user_id
         JOIN restaurants r ON r.id = w.restaurant_id
         WHERE w.status IN ('waiting', 'called')
         ORDER BY w.registered_at DESC
         LIMIT 20`,
      ),
      query(
        `SELECT n.id, n.channel, n.message, n.status, n.sent_at, u.email AS user_email
         FROM notifications n
         JOIN users u ON u.id = n.user_id
         ORDER BY n.sent_at DESC
         LIMIT 15`,
      ),
    ])

    return res.json({
      restaurants: restaurants.rows,
      active_waitlist: active.rows,
      recent_notifications: notifications.rows,
    })
  } catch (error) {
    console.error('soporte overview', error)
    return res.status(500).json({ message: 'Error al cargar vista de soporte' })
  }
})

export default router
