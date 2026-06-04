import { Router } from 'express'
import { query } from '../db/pool.js'
import { validateToken } from '../middleware/auth.js'

const router = Router()

// GET /publicaciones -> Obtener feed de novedades/anuncios
router.get('/', validateToken, async (_req, res) => {
  try {
    const result = await query(
      `SELECT p.id, p.user_id, p.title, p.content, p.created_at, u.name AS author_name, u.role AS author_role
       FROM publicaciones p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC`,
    )
    return res.json({ publicaciones: result.rows })
  } catch (error) {
    console.error('get publicaciones error', error)
    return res.status(500).json({ message: 'Error al cargar las novedades' })
  }
})

// POST /publicaciones -> Crear una publicación (solo admin, gerente o soporte pueden anunciar, pero usuarios pueden comentar/reseñar. Permitiremos a todos crear para demostrar 1:N)
router.post('/', validateToken, async (req, res) => {
  const { title, content } = req.body

  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ message: 'El título y el contenido son requeridos' })
  }

  if (title.trim().length < 3) {
    return res.status(400).json({ message: 'El título debe tener al menos 3 caracteres' })
  }

  try {
    const result = await query(
      `INSERT INTO publicaciones (user_id, title, content)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, title, content, created_at`,
      [req.user.id, title.trim(), content.trim()],
    )

    return res.status(201).json({
      publicacion: result.rows[0],
      message: 'Publicación creada exitosamente',
    })
  } catch (error) {
    console.error('create publicacion error', error)
    return res.status(500).json({ message: 'Error al crear la publicación' })
  }
})

// PUT /publicaciones/:id -> Editar publicación
router.put('/:id', validateToken, async (req, res) => {
  const { title, content } = req.body

  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ message: 'El título y el contenido son requeridos' })
  }

  try {
    // Verificar propiedad o si es administrador
    const postRes = await query(`SELECT user_id FROM publicaciones WHERE id = $1`, [req.params.id])
    if (postRes.rowCount === 0) {
      return res.status(404).json({ message: 'Publicación no encontrada' })
    }

    if (postRes.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para editar esta publicación' })
    }

    const result = await query(
      `UPDATE publicaciones
       SET title = $1, content = $2
       WHERE id = $3
       RETURNING id, user_id, title, content, created_at`,
      [title.trim(), content.trim(), req.params.id],
    )

    return res.json({
      publicacion: result.rows[0],
      message: 'Publicación editada correctamente',
    })
  } catch (error) {
    console.error('update publicacion error', error)
    return res.status(500).json({ message: 'Error al actualizar la publicación' })
  }
})

// DELETE /publicaciones/:id -> Eliminar publicación
router.delete('/:id', validateToken, async (req, res) => {
  try {
    // Verificar propiedad o si es administrador
    const postRes = await query(`SELECT user_id FROM publicaciones WHERE id = $1`, [req.params.id])
    if (postRes.rowCount === 0) {
      return res.status(404).json({ message: 'Publicación no encontrada' })
    }

    if (postRes.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No tienes permisos para eliminar esta publicación' })
    }

    await query(`DELETE FROM publicaciones WHERE id = $1`, [req.params.id])
    return res.status(204).send()
  } catch (error) {
    console.error('delete publicacion error', error)
    return res.status(500).json({ message: 'Error al eliminar la publicación' })
  }
})

export default router
