import { Router } from 'express'
import { query } from '../db/pool.js'
import { validateToken, requireRoles } from '../middleware/auth.js'
import { assertRestaurantAccess } from '../services/staff.js'

const router = Router()

router.get('/my', validateToken, requireRoles('usuario'), async (req, res) => {
  try {
    const result = await query(
      `SELECT w.id, w.restaurant_id, w.party_size, w.status, w.position, w.registered_at, w.called_at,
              r.name AS restaurant_name, r.address AS restaurant_address,
              r.estimated_wait_minutes
       FROM waitlist_entries w
       JOIN restaurants r ON r.id = w.restaurant_id
       WHERE w.user_id = $1 AND w.status IN ('waiting', 'called')
       ORDER BY w.registered_at DESC
       LIMIT 1`,
      [req.user.id],
    )

    return res.json({ entry: result.rows[0] ?? null })
  } catch (error) {
    console.error('waitlist my', error)
    return res.status(500).json({ message: 'Error al cargar tu turno' })
  }
})

router.post('/', validateToken, requireRoles('usuario'), async (req, res) => {
  const { restaurant_id, party_size } = req.body

  if (!restaurant_id || !party_size) {
    return res.status(400).json({ message: 'restaurant_id y party_size son requeridos' })
  }

  try {
    const duplicate = await query(
      `SELECT id FROM waitlist_entries
       WHERE user_id = $1 AND restaurant_id = $2 AND status IN ('waiting', 'called')`,
      [req.user.id, restaurant_id],
    )

    if (duplicate.rowCount > 0) {
      return res.status(409).json({ message: 'Ya estás en la fila de este restaurante' })
    }

    const positionResult = await query(
      `SELECT COALESCE(MAX(position), 0) + 1 AS next_position
       FROM waitlist_entries
       WHERE restaurant_id = $1 AND status IN ('waiting', 'called')`,
      [restaurant_id],
    )

    const position = positionResult.rows[0].next_position

    const insert = await query(
      `INSERT INTO waitlist_entries (restaurant_id, user_id, party_size, position)
       VALUES ($1, $2, $3, $4)
       RETURNING id, restaurant_id, party_size, status, position, registered_at`,
      [restaurant_id, req.user.id, party_size, position],
    )

    return res.status(201).json(insert.rows[0])
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Ya estás en la fila de este restaurante' })
    }
    console.error('waitlist join', error)
    return res.status(500).json({ message: 'Error al unirse a la fila' })
  }
})

router.delete('/:id', validateToken, requireRoles('usuario'), async (req, res) => {
  try {
    const result = await query(
      `UPDATE waitlist_entries
       SET status = 'cancelled', cancelled_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status IN ('waiting', 'called')
       RETURNING id`,
      [req.params.id, req.user.id],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Turno no encontrado' })
    }

    return res.status(204).send()
  } catch (error) {
    console.error('waitlist cancel', error)
    return res.status(500).json({ message: 'Error al cancelar turno' })
  }
})

router.put('/:id/confirm', validateToken, requireRoles('usuario'), async (req, res) => {
  try {
    const result = await query(
      `UPDATE waitlist_entries
       SET status = 'arrived', arrived_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status = 'called'
       RETURNING id, status`,
      [req.params.id, req.user.id],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Turno no encontrado o no ha sido llamado' })
    }

    return res.json(result.rows[0])
  } catch (error) {
    console.error('waitlist confirm', error)
    return res.status(500).json({ message: 'Error al confirmar llegada' })
  }
})

router.post('/:id/call', validateToken, requireRoles('recepcionista', 'gerente'), async (req, res) => {
  try {
    const entryResult = await query(
      `SELECT restaurant_id FROM waitlist_entries WHERE id = $1`,
      [req.params.id],
    )

    const entry = entryResult.rows[0]

    if (!entry) {
      return res.status(404).json({ message: 'Turno no encontrado' })
    }

    const allowed = await assertRestaurantAccess(req.user.id, req.user.role, entry.restaurant_id)

    if (!allowed) {
      return res.status(403).json({ message: 'Sin acceso a este restaurante' })
    }

    const result = await query(
      `UPDATE waitlist_entries
       SET status = 'called', called_at = NOW()
       WHERE id = $1 AND status = 'waiting'
       RETURNING id, user_id, restaurant_id, status, called_at`,
      [req.params.id],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Turno no disponible para llamar' })
    }

    return res.json(result.rows[0])
  } catch (error) {
    console.error('waitlist call', error)
    return res.status(500).json({ message: 'Error al llamar turno' })
  }
})

router.delete('/:id/remove', validateToken, requireRoles('recepcionista', 'gerente'), async (req, res) => {
  try {
    const entryResult = await query(
      `SELECT restaurant_id FROM waitlist_entries WHERE id = $1`,
      [req.params.id],
    )

    const entry = entryResult.rows[0]

    if (!entry) {
      return res.status(404).json({ message: 'Turno no encontrado' })
    }

    const allowed = await assertRestaurantAccess(req.user.id, req.user.role, entry.restaurant_id)

    if (!allowed) {
      return res.status(403).json({ message: 'Sin acceso a este restaurante' })
    }

    await query(
      `UPDATE waitlist_entries
       SET status = 'cancelled', cancelled_at = NOW()
       WHERE id = $1`,
      [req.params.id],
    )

    return res.status(204).send()
  } catch (error) {
    console.error('waitlist remove', error)
    return res.status(500).json({ message: 'Error al eliminar turno' })
  }
})

export default router
