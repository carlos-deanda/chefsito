import { Router } from 'express'
import { query } from '../db/pool.js'
import { validateToken } from '../middleware/auth.js'

const router = Router()

// GET /auth/profile -> Obtener perfil del usuario autenticado
router.get('/', validateToken, async (req, res) => {
  try {
    // Buscar perfil
    let result = await query(
      `SELECT user_id, bio, avatar_url, preferences, updated_at
       FROM user_profiles
       WHERE user_id = $1`,
      [req.user.id],
    )

    // Si no existe, crear uno por defecto (1:1 asegurado)
    if (result.rowCount === 0) {
      await query(
        `INSERT INTO user_profiles (user_id, bio, avatar_url, preferences)
         VALUES ($1, '', '', '{}'::jsonb)`,
        [req.user.id],
      )
      result = await query(
        `SELECT user_id, bio, avatar_url, preferences, updated_at
         FROM user_profiles
         WHERE user_id = $1`,
        [req.user.id],
      )
    }

    return res.json({ profile: result.rows[0] })
  } catch (error) {
    console.error('get profile error', error)
    return res.status(500).json({ message: 'Error al obtener el perfil del usuario' })
  }
})

// PUT /auth/profile -> Actualizar perfil del usuario autenticado
router.put('/', validateToken, async (req, res) => {
  const { bio = '', avatar_url = '', preferences = {} } = req.body

  // Validaciones
  if (bio && bio.length > 500) {
    return res.status(400).json({ message: 'La biografía no puede exceder los 500 caracteres' })
  }

  if (avatar_url && !avatar_url.startsWith('http://') && !avatar_url.startsWith('https://')) {
    return res.status(400).json({ message: 'El URL de avatar debe ser válido (comenzar con http:// o https://)' })
  }

  try {
    const preferencesJson = typeof preferences === 'string' ? preferences : JSON.stringify(preferences)
    
    // UPSERT para garantizar que exista
    const result = await query(
      `INSERT INTO user_profiles (user_id, bio, avatar_url, preferences)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (user_id) DO UPDATE
       SET bio = EXCLUDED.bio,
           avatar_url = EXCLUDED.avatar_url,
           preferences = EXCLUDED.preferences,
           updated_at = NOW()
       RETURNING user_id, bio, avatar_url, preferences, updated_at`,
      [req.user.id, bio.trim(), avatar_url.trim(), preferencesJson],
    )

    return res.json({
      profile: result.rows[0],
      message: 'Perfil actualizado correctamente',
    })
  } catch (error) {
    console.error('update profile error', error)
    return res.status(500).json({ message: 'Error al actualizar el perfil' })
  }
})

export default router
