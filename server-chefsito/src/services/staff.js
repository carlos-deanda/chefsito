import { query } from '../db/pool.js'

export async function getStaffRestaurantId(userId, role) {
  if (role === 'gerente') {
    const result = await query(
      `SELECT id FROM restaurants WHERE manager_id = $1 LIMIT 1`,
      [userId],
    )
    return result.rows[0]?.id ?? null
  }

  if (role === 'recepcionista') {
    const result = await query(
      `SELECT restaurant_id FROM restaurant_staff WHERE user_id = $1 LIMIT 1`,
      [userId],
    )
    return result.rows[0]?.restaurant_id ?? null
  }

  return null
}

export async function assertRestaurantAccess(userId, role, restaurantId) {
  if (role === 'admin') {
    return true
  }

  if (role === 'gerente') {
    const result = await query(
      `SELECT 1 FROM restaurants WHERE id = $1 AND manager_id = $2`,
      [restaurantId, userId],
    )
    return result.rowCount > 0
  }

  if (role === 'recepcionista') {
    const result = await query(
      `SELECT 1 FROM restaurant_staff WHERE restaurant_id = $1 AND user_id = $2`,
      [restaurantId, userId],
    )
    return result.rowCount > 0
  }

  return false
}
