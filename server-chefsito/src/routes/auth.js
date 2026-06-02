import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { query } from '../db/pool.js'
import { validateToken } from '../middleware/auth.js'

const router = Router()

function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  )
}

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
  }
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos' })
  }

  try {
    const result = await query(
      `SELECT id, name, email, phone, role, password_hash
       FROM users
       WHERE LOWER(email) = LOWER($1) AND is_active = TRUE`,
      [email.trim()],
    )

    const user = result.rows[0]

    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)

    if (!valid) {
      return res.status(401).json({ message: 'Credenciales incorrectas' })
    }

    const safeUser = publicUser(user)

    return res.json({
      user: safeUser,
      access_token: signToken(safeUser),
    })
  } catch (error) {
    console.error('login error', error)
    return res.status(500).json({ message: 'Error al iniciar sesión' })
  }
})

router.get('/me', validateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, phone, role FROM users WHERE id = $1 AND is_active = TRUE`,
      [req.user.id],
    )

    const user = result.rows[0]

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    return res.json({ user: publicUser(user) })
  } catch (error) {
    console.error('me error', error)
    return res.status(500).json({ message: 'Error al obtener perfil' })
  }
})

router.post('/logout', validateToken, (_req, res) => {
  res.status(204).send()
})

export default router
