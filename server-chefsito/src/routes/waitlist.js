import { Router } from 'express'
import { query } from '../db/pool.js'
import { validateToken, requireRoles } from '../middleware/auth.js'
import { assertRestaurantAccess } from '../services/staff.js'

const router = Router()

async function addNotification(userId, entryId, channel, message) {
  try {
    await query(
      `INSERT INTO notifications (waitlist_entry_id, user_id, channel, message, status)
       VALUES ($1, $2, $3, $4, 'sent')`,
      [entryId, userId, channel, message]
    )
  } catch (error) {
    console.error('Failed to insert notification', error)
  }
}

router.get('/notifications', validateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, channel, message, status, sent_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY sent_at DESC
       LIMIT 10`,
      [req.user.id],
    )
    return res.json({ notifications: result.rows })
  } catch (error) {
    console.error('notifications list', error)
    return res.status(500).json({ message: 'Error al cargar notificaciones' })
  }
})

router.get('/my', validateToken, requireRoles('usuario'), async (req, res) => {
  try {
    const result = await query(
      `SELECT w.id, w.restaurant_id, w.party_size, w.status, w.position, w.registered_at, w.called_at, w.arrived_at, w.cancelled_at,
              r.name AS restaurant_name, r.address AS restaurant_address,
              r.estimated_wait_minutes
       FROM waitlist_entries w
       JOIN restaurants r ON r.id = w.restaurant_id
       WHERE w.user_id = $1
        AND w.status IN ('waiting', 'called')
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

    const restNameRes = await query(`SELECT name FROM restaurants WHERE id = $1`, [restaurant_id])
    const restName = restNameRes.rows[0]?.name || 'el restaurante'
    await addNotification(
      req.user.id,
      insert.rows[0].id,
      'push',
      `Te has unido a la fila en ${restName}. Tu posición inicial es #${position}.`
    )

    const io = req.app.get('io')
    if (io) {
      io.emit('waitlist:changed', { restaurant_id })
    }

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
       RETURNING id, restaurant_id, position`,
      [req.params.id, req.user.id],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Turno no encontrado' })
    }

    const { restaurant_id, position } = result.rows[0]
    await query(
      `UPDATE waitlist_entries
       SET position = position - 1
       WHERE restaurant_id = $1 AND status IN ('waiting', 'called') AND position > $2`,
      [restaurant_id, position],
    )

    const restNameRes = await query(`SELECT name FROM restaurants WHERE id = $1`, [restaurant_id])
    const restName = restNameRes.rows[0]?.name || 'el restaurante'
    await addNotification(
      req.user.id,
      result.rows[0].id,
      'email',
      `Has cancelado tu turno en ${restName}.`
    )

    const io = req.app.get('io')
    if (io) {
      io.emit('waitlist:changed', { restaurant_id })
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
       RETURNING id, restaurant_id, position, status`,
      [req.params.id, req.user.id],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Turno no encontrado o no ha sido llamado' })
    }

    const { restaurant_id, position } = result.rows[0]
    await query(
      `UPDATE waitlist_entries
       SET position = position - 1
       WHERE restaurant_id = $1 AND status IN ('waiting', 'called') AND position > $2`,
      [restaurant_id, position],
    )

    const restNameRes = await query(`SELECT name FROM restaurants WHERE id = $1`, [restaurant_id])
    const restName = restNameRes.rows[0]?.name || 'el restaurante'
    await addNotification(
      req.user.id,
      result.rows[0].id,
      'push',
      `Confirmaste tu llegada en ${restName}. ¡Mesa asignada!`
    )

    const io = req.app.get('io')
    if (io) {
      io.emit('waitlist:changed', { restaurant_id })
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

    const restNameRes = await query(
      `SELECT r.name, w.user_id FROM waitlist_entries w JOIN restaurants r ON r.id = w.restaurant_id WHERE w.id = $1`,
      [req.params.id]
    )
    const restName = restNameRes.rows[0]?.name || 'el restaurante'
    const guestUserId = restNameRes.rows[0]?.user_id
    await addNotification(
      guestUserId,
      result.rows[0].id,
      'whatsapp',
      `¡Tu mesa en ${restName} está lista! Tienes 5 minutos para entrar, si no tu turno se perderá. Por favor confirma tu llegada.`
    )

    const io = req.app.get('io')
    if (io) {
      io.emit('waitlist:changed', { restaurant_id: entry.restaurant_id })
    }

    return res.json(result.rows[0])
  } catch (error) {
    console.error('waitlist call', error)
    return res.status(500).json({ message: 'Error al llamar turno' })
  }
})

router.post('/:id/arrive', validateToken, requireRoles('recepcionista', 'gerente'), async (req, res) => {
  try {
    const entryResult = await query(
      `SELECT restaurant_id, position FROM waitlist_entries WHERE id = $1 AND status IN ('waiting', 'called')`,
      [req.params.id],
    )

    const entry = entryResult.rows[0]

    if (!entry) {
      return res.status(404).json({ message: 'Turno no encontrado o ya no está activo' })
    }

    const allowed = await assertRestaurantAccess(req.user.id, req.user.role, entry.restaurant_id)

    if (!allowed) {
      return res.status(403).json({ message: 'Sin acceso a este restaurante' })
    }

    const result = await query(
      `UPDATE waitlist_entries
       SET status = 'arrived', arrived_at = NOW()
       WHERE id = $1 AND status IN ('waiting', 'called')
       RETURNING id, restaurant_id, position, status, arrived_at`,
      [req.params.id],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'El turno no se puede marcar como llegado/liberado' })
    }

    const { restaurant_id, position } = result.rows[0]
    await query(
      `UPDATE waitlist_entries
       SET position = position - 1
       WHERE restaurant_id = $1 AND status IN ('waiting', 'called') AND position > $2`,
      [restaurant_id, position],
    )

    const restNameRes = await query(
      `SELECT r.name, w.user_id FROM waitlist_entries w JOIN restaurants r ON r.id = w.restaurant_id WHERE w.id = $1`,
      [req.params.id]
    )
    const restName = restNameRes.rows[0]?.name || 'el restaurante'
    const guestUserId = restNameRes.rows[0]?.user_id
    await addNotification(
      guestUserId,
      result.rows[0].id,
      'push',
      `¡Tu mesa en ${restName} ha sido asignada! Disfruta tu comida.`
    )

    const io = req.app.get('io')
    if (io) {
      io.emit('waitlist:changed', { restaurant_id })
    }

    return res.json(result.rows[0])
  } catch (error) {
    console.error('waitlist arrive', error)
    return res.status(500).json({ message: 'Error al liberar el turno' })
  }
})

router.delete('/:id/remove', validateToken, requireRoles('recepcionista', 'gerente'), async (req, res) => {
  try {
    const entryResult = await query(
      `SELECT restaurant_id, position FROM waitlist_entries WHERE id = $1 AND status IN ('waiting', 'called')`,
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
       SET status = 'cancelled', cancelled_at = NOW()
       WHERE id = $1 AND status IN ('waiting', 'called')
       RETURNING id, restaurant_id, position`,
      [req.params.id],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'El turno no se puede eliminar' })
    }

    const { restaurant_id, position } = result.rows[0]
    await query(
      `UPDATE waitlist_entries
       SET position = position - 1
       WHERE restaurant_id = $1 AND status IN ('waiting', 'called') AND position > $2`,
      [restaurant_id, position],
    )

    const restNameRes = await query(
      `SELECT r.name, w.user_id FROM waitlist_entries w JOIN restaurants r ON r.id = w.restaurant_id WHERE w.id = $1`,
      [req.params.id]
    )
    const restName = restNameRes.rows[0]?.name || 'el restaurante'
    const guestUserId = restNameRes.rows[0]?.user_id
    await addNotification(
      guestUserId,
      result.rows[0].id,
      'email',
      `Tu turno en ${restName} ha sido cancelado.`
    )

    const io = req.app.get('io')
    if (io) {
      io.emit('waitlist:changed', { restaurant_id })
    }

    return res.status(204).send()
  } catch (error) {
    console.error('waitlist remove', error)
    return res.status(500).json({ message: 'Error al eliminar turno' })
  }
})

export default router
