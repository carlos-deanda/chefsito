import { Router } from 'express'
import bcrypt from 'bcrypt'
import { getPool, query } from '../db/pool.js'
import { validateToken, requireRoles } from '../middleware/auth.js'

const router = Router()

const STAFF_ROLES = ['admin', 'recepcionista', 'gerente', 'soporte']

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
       WHERE role <> 'usuario'
       ORDER BY created_at DESC`,
    )
    return res.json({ users: result.rows })
  } catch (error) {
    console.error('admin users', error)
    return res.status(500).json({ message: 'Error al cargar usuarios' })
  }
})

router.post('/users', async (req, res) => {
  const {
    name,
    email,
    phone,
    role,
    password = 'password',
    restaurant_id: restaurantId,
  } = req.body

  if (!name?.trim() || !email?.trim() || !role) {
    return res.status(400).json({ message: 'Nombre, email y rol son requeridos' })
  }

  if (!STAFF_ROLES.includes(role)) {
    return res.status(400).json({
      message: 'Solo puedes crear cuentas de personal (admin, recepcionista, gerente, soporte). Los clientes se registran solos.',
    })
  }

  if ((role === 'recepcionista' || role === 'gerente') && !restaurantId) {
    return res.status(400).json({ message: 'Selecciona un restaurante para recepcionista o gerente' })
  }

  const client = await getPool().connect()

  try {
    await client.query('BEGIN')

    const passwordHash = await bcrypt.hash(password, 10)
    const userResult = await client.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5::user_role)
       RETURNING id, name, email, phone, role, created_at`,
      [name.trim(), email.trim().toLowerCase(), phone?.trim() ?? null, passwordHash, role],
    )

    const newUser = userResult.rows[0]

    if (role === 'recepcionista') {
      await client.query(
        `INSERT INTO restaurant_staff (restaurant_id, user_id) VALUES ($1, $2)`,
        [restaurantId, newUser.id],
      )
    }

    if (role === 'gerente') {
      await client.query(
        `UPDATE restaurants SET manager_id = $1 WHERE id = $2`,
        [newUser.id, restaurantId],
      )
      await client.query(
        `INSERT INTO restaurant_staff (restaurant_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (restaurant_id, user_id) DO NOTHING`,
        [restaurantId, newUser.id],
      )
    }

    await client.query('COMMIT')

    return res.status(201).json({
      user: newUser,
      message: `Cuenta creada. El usuario puede entrar con ${newUser.email} y la contraseña asignada.`,
    })
  } catch (error) {
    await client.query('ROLLBACK')

    if (error.code === '23505') {
      return res.status(409).json({ message: 'Ya existe una cuenta con ese email' })
    }
    console.error('admin create user', error)
    return res.status(500).json({ message: 'Error al crear la cuenta' })
  } finally {
    client.release()
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
