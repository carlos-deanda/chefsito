import { Router } from 'express'
import { query } from '../db/pool.js'
import { validateToken, requireRoles } from '../middleware/auth.js'

const router = Router()

router.use(validateToken, requireRoles('admin'))

router.get('/overview', async (_req, res) => {
  try {
    const [users, restaurants, waitlist, byRole] = await Promise.all([
      query(`SELECT COUNT(*)::INT AS count FROM users WHERE is_active = TRUE`),
      query(`SELECT COUNT(*)::INT AS count FROM restaurants`),
      query(
        `SELECT COUNT(*)::INT AS count FROM waitlist_entries WHERE status IN ('waiting', 'called')`,
      ),
      query(
        `SELECT role, COUNT(*)::INT AS count FROM users WHERE is_active = TRUE GROUP BY role ORDER BY role`,
      ),
    ])

    return res.json({
      users_count: users.rows[0].count,
      restaurants_count: restaurants.rows[0].count,
      active_waitlist_count: waitlist.rows[0].count,
      users_by_role: byRole.rows,
    })
  } catch (error) {
    console.error('admin overview', error)
    return res.status(500).json({ message: 'Error al cargar resumen' })
  }
})

router.get('/users', async (_req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, phone, role, is_active, created_at
       FROM users
       ORDER BY created_at DESC`,
    )
    return res.json({ users: result.rows })
  } catch (error) {
    console.error('admin users', error)
    return res.status(500).json({ message: 'Error al cargar usuarios' })
  }
})

router.get('/restaurants', async (_req, res) => {
  try {
    const result = await query(
      `SELECT r.id, r.name, r.cuisine, r.address, r.status, r.estimated_wait_minutes,
              u.name AS manager_name,
              (SELECT COUNT(*)::INT FROM waitlist_entries w
               WHERE w.restaurant_id = r.id AND w.status IN ('waiting', 'called')) AS people_waiting
       FROM restaurants r
       LEFT JOIN users u ON u.id = r.manager_id
       ORDER BY r.name`,
    )
    return res.json({ restaurants: result.rows })
  } catch (error) {
    console.error('admin restaurants', error)
    return res.status(500).json({ message: 'Error al cargar restaurantes' })
  }
})

export default router
