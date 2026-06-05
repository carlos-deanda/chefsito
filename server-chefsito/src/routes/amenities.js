import { Router } from 'express'
import { query } from '../db/pool.js'
import { validateToken } from '../middleware/auth.js'

const router = Router()

// Aplicar token de seguridad para la gestión de amenidades
router.use(validateToken)

// GET /amenities -> Obtener todas las amenidades registradas
router.get('/', async (_req, res) => {
  try {
    const result = await query(`SELECT id, name, description FROM amenities ORDER BY name`)
    return res.json({ amenities: result.rows })
  } catch (error) {
    console.error('get amenities error', error)
    return res.status(500).json({ message: 'Error al obtener las amenidades' })
  }
})

// POST /amenities -> Registrar una nueva amenidad (ej: WiFi, Pet Friendly)
router.post('/', async (req, res) => {
  const { name, description } = req.body

  if (!name?.trim()) {
    return res.status(400).json({ message: 'El nombre de la amenidad es requerido' })
  }

  try {
    const result = await query(
      `INSERT INTO amenities (name, description)
       VALUES ($1, $2)
       RETURNING id, name, description`,
      [name.trim(), description?.trim() || null],
    )
    return res.status(201).json({
      amenity: result.rows[0],
      message: 'Amenidad registrada exitosamente',
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Ya existe una amenidad con este nombre' })
    }
    console.error('create amenity error', error)
    return res.status(500).json({ message: 'Error al registrar la amenidad' })
  }
})

// GET /amenities/restaurants -> Obtener restaurantes con sus amenidades asignadas (N:M agregada)
router.get('/restaurants', async (_req, res) => {
  try {
    // Traer todos los restaurantes
    const restResult = await query(`SELECT id, name, cuisine, address FROM restaurants ORDER BY name`)
    const restaurants = restResult.rows

    // Traer todos los enlaces de amenidades
    const linkResult = await query(
      `SELECT ra.restaurant_id, ra.amenity_id, a.name AS amenity_name, a.description AS amenity_description
       FROM restaurant_amenities ra
       JOIN amenities a ON a.id = ra.amenity_id
       ORDER BY a.name`,
    )
    const links = linkResult.rows

    // Mapear amenidades a cada restaurante
    const restaurantsWithAmenities = restaurants.map((r) => ({
      ...r,
      amenities: links
        .filter((l) => l.restaurant_id === r.id)
        .map((l) => ({
          id: l.amenity_id,
          name: l.amenity_name,
          description: l.amenity_description,
        })),
    }))

    return res.json({ restaurants: restaurantsWithAmenities })
  } catch (error) {
    console.error('get restaurants with amenities error', error)
    return res.status(500).json({ message: 'Error al obtener la lista de amenidades de restaurantes' })
  }
})

// POST /amenities/link -> Asociar una amenidad a un restaurante (N:M inserción)
router.post('/link', async (req, res) => {
  const { restaurant_id, amenity_id } = req.body

  if (!restaurant_id || !amenity_id) {
    return res.status(400).json({ message: 'restaurant_id y amenity_id son requeridos' })
  }

  try {
    const result = await query(
      `INSERT INTO restaurant_amenities (restaurant_id, amenity_id)
       VALUES ($1, $2)
       RETURNING restaurant_id, amenity_id, linked_at`,
      [restaurant_id, amenity_id],
    )
    return res.status(201).json({
      link: result.rows[0],
      message: 'Amenidad asociada al restaurante con éxito',
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Esta amenidad ya está asociada a este restaurante' })
    }
    console.error('link amenity error', error)
    return res.status(500).json({ message: 'Error al asociar la amenidad' })
  }
})

// DELETE /amenities/link -> Desasociar una amenidad de un restaurante (N:M eliminación)
router.delete('/link', async (req, res) => {
  const { restaurant_id, amenity_id } = req.body

  if (!restaurant_id || !amenity_id) {
    return res.status(400).json({ message: 'restaurant_id y amenity_id son requeridos en el cuerpo' })
  }

  try {
    const result = await query(
      `DELETE FROM restaurant_amenities
       WHERE restaurant_id = $1 AND amenity_id = $2`,
      [restaurant_id, amenity_id],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Asociación no encontrada' })
    }

    return res.status(200).json({ message: 'Amenidad removida del restaurante correctamente' })
  } catch (error) {
    console.error('unlink amenity error', error)
    return res.status(500).json({ message: 'Error al remover la amenidad' })
  }
})

export default router
