import { Router } from 'express'
import bcrypt from 'bcrypt'
import { getPool, query } from '../db/pool.js'
import { validateToken, requireRoles } from '../middleware/auth.js'

const router = Router()

const STAFF_ROLES = ['admin', 'recepcionista', 'gerente', 'soporte']
const RESTAURANT_STATUSES = ['open', 'paused', 'closed']

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
      `SELECT r.id, r.name, r.cuisine, r.address, r.lat, r.lng, r.table_count,
              r.status, r.estimated_wait_minutes,
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

router.post('/restaurants', async (req, res) => {
  const {
    name,
    cuisine,
    address,
    lat,
    lng,
    table_count: tableCount = 10,
    status = 'open',
    estimated_wait_minutes: estimatedWaitMinutes = 15,
    manager_id: managerId,
  } = req.body

  const parsedLat = Number(lat)
  const parsedLng = Number(lng)
  const parsedTableCount = Number(tableCount)
  const parsedEstimatedWaitMinutes = Number(estimatedWaitMinutes)

  if (!name?.trim() || !address?.trim()) {
    return res.status(400).json({ message: 'Nombre y direccion son requeridos' })
  }

  if (!Number.isFinite(parsedLat) || parsedLat < -90 || parsedLat > 90) {
    return res.status(400).json({ message: 'Latitud invalida' })
  }

  if (!Number.isFinite(parsedLng) || parsedLng < -180 || parsedLng > 180) {
    return res.status(400).json({ message: 'Longitud invalida' })
  }

  if (!Number.isInteger(parsedTableCount) || parsedTableCount <= 0) {
    return res.status(400).json({ message: 'El numero de mesas debe ser mayor a 0' })
  }

  if (!Number.isInteger(parsedEstimatedWaitMinutes) || parsedEstimatedWaitMinutes < 0) {
    return res.status(400).json({ message: 'La espera estimada no puede ser negativa' })
  }

  if (!RESTAURANT_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Estado invalido' })
  }

  const normalizedManagerId = managerId || null
  const client = await getPool().connect()

  try {
    await client.query('BEGIN')

    if (normalizedManagerId) {
      const manager = await client.query(
        `SELECT id FROM users WHERE id = $1 AND role = 'gerente' AND is_active = TRUE`,
        [normalizedManagerId],
      )

      if (!manager.rows[0]) {
        await client.query('ROLLBACK')
        return res.status(400).json({ message: 'Selecciona un gerente valido' })
      }

      const currentRestaurant = await client.query(
        `SELECT name FROM restaurants WHERE manager_id = $1 LIMIT 1`,
        [normalizedManagerId],
      )

      if (currentRestaurant.rows[0]) {
        await client.query('ROLLBACK')
        return res.status(409).json({
          message: `Ese gerente ya esta asignado a ${currentRestaurant.rows[0].name}`,
        })
      }
    }

    const result = await client.query(
      `INSERT INTO restaurants
         (name, cuisine, address, lat, lng, table_count, status, estimated_wait_minutes, manager_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7::restaurant_status, $8, $9)
       RETURNING id, name, cuisine, address, lat, lng, table_count, status,
                 estimated_wait_minutes, manager_id, created_at`,
      [
        name.trim(),
        cuisine?.trim() || null,
        address.trim(),
        parsedLat,
        parsedLng,
        parsedTableCount,
        status,
        parsedEstimatedWaitMinutes,
        normalizedManagerId,
      ],
    )

    const restaurant = result.rows[0]

    if (normalizedManagerId) {
      await client.query(
        `INSERT INTO restaurant_staff (restaurant_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (restaurant_id, user_id) DO NOTHING`,
        [restaurant.id, normalizedManagerId],
      )
    }

    await client.query('COMMIT')

    return res.status(201).json({
      restaurant,
      message: `Restaurante ${restaurant.name} registrado correctamente.`,
    })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('admin create restaurant', error)
    return res.status(500).json({ message: 'Error al registrar restaurante' })
  } finally {
    client.release()
  }
})

// PUT /admin/restaurants/:id -> Actualizar un restaurante existente
router.put('/restaurants/:id', async (req, res) => {
  const {
    name,
    cuisine,
    address,
    lat,
    lng,
    table_count,
    status,
    estimated_wait_minutes,
  } = req.body

  const parsedLat = Number(lat)
  const parsedLng = Number(lng)
  const parsedTableCount = Number(table_count)
  const parsedEstimatedWaitMinutes = Number(estimated_wait_minutes)

  if (!name?.trim() || !address?.trim()) {
    return res.status(400).json({ message: 'Nombre y dirección son requeridos' })
  }

  if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
    return res.status(400).json({ message: 'Latitud inválida' })
  }

  if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
    return res.status(400).json({ message: 'Longitud inválida' })
  }

  if (isNaN(parsedTableCount) || parsedTableCount <= 0) {
    return res.status(400).json({ message: 'El número de mesas debe ser mayor a 0' })
  }

  if (isNaN(parsedEstimatedWaitMinutes) || parsedEstimatedWaitMinutes < 0) {
    return res.status(400).json({ message: 'La espera estimada no puede ser negativa' })
  }

  if (!RESTAURANT_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Estado inválido' })
  }

  try {
    const result = await query(
      `UPDATE restaurants
       SET name = $1, cuisine = $2, address = $3, lat = $4, lng = $5,
           table_count = $6, status = $7::restaurant_status, estimated_wait_minutes = $8,
           updated_at = NOW()
       WHERE id = $9
       RETURNING id, name, cuisine, address, lat, lng, table_count, status, estimated_wait_minutes`,
      [
        name.trim(),
        cuisine?.trim() || null,
        address.trim(),
        parsedLat,
        parsedLng,
        parsedTableCount,
        status,
        parsedEstimatedWaitMinutes,
        req.params.id,
      ],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Restaurante no encontrado' })
    }

    // Notificar cambio
    const io = req.app.get('io')
    if (io) {
      io.emit('restaurant:status_changed', { id: req.params.id, status })
    }

    return res.json({
      restaurant: result.rows[0],
      message: 'Restaurante actualizado correctamente',
    })
  } catch (error) {
    console.error('admin update restaurant error', error)
    return res.status(500).json({ message: 'Error al actualizar el restaurante' })
  }
})

// DELETE /admin/restaurants/:id -> Eliminar un restaurante existente
router.delete('/restaurants/:id', async (req, res) => {
  try {
    const result = await query(
      `DELETE FROM restaurants WHERE id = $1 RETURNING id, name`,
      [req.params.id],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Restaurante no encontrado' })
    }

    const io = req.app.get('io')
    if (io) {
      io.emit('restaurant:deleted', { id: req.params.id })
    }

    return res.json({ message: `Restaurante "${result.rows[0].name}" eliminado correctamente` })
  } catch (error) {
    console.error('admin delete restaurant error', error)
    return res.status(500).json({ message: 'Error al eliminar el restaurante' })
  }
})

// PUT /admin/users/:id -> Editar información de un usuario/empleado
router.put('/users/:id', async (req, res) => {
  const { name, email, phone, role } = req.body

  if (!name?.trim() || !email?.trim() || !role) {
    return res.status(400).json({ message: 'Nombre, email y rol son requeridos' })
  }

  if (!STAFF_ROLES.includes(role)) {
    return res.status(400).json({ message: 'Rol inválido' })
  }

  try {
    const result = await query(
      `UPDATE users
       SET name = $1, email = $2::varchar(255), phone = $3, role = $4::user_role, updated_at = NOW()
       WHERE id = $5
       RETURNING id, name, email, phone, role, is_active`,
      [name.trim(), email.trim().toLowerCase(), phone?.trim() || null, role, req.params.id],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    return res.json({
      user: result.rows[0],
      message: 'Usuario actualizado correctamente',
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Ya existe un usuario con ese correo electrónico' })
    }
    console.error('admin update user error', error)
    return res.status(500).json({ message: 'Error al actualizar el usuario' })
  }
})

// PUT /admin/users/:id/toggle-active -> Desactivar/Activar cuenta (Soft Delete/Baja)
router.put('/users/:id/toggle-active', async (req, res) => {
  try {
    const userRes = await query(`SELECT is_active FROM users WHERE id = $1`, [req.params.id])
    if (userRes.rowCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    const nextStatus = !userRes.rows[0].is_active

    const result = await query(
      `UPDATE users
       SET is_active = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, email, role, is_active`,
      [nextStatus, req.params.id],
    )

    return res.json({
      user: result.rows[0],
      message: nextStatus ? 'Usuario reactivado' : 'Usuario desactivado (dado de baja)',
    })
  } catch (error) {
    console.error('admin toggle active error', error)
    return res.status(500).json({ message: 'Error al cambiar estado de actividad' })
  }
})

export default router
