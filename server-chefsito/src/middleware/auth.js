import jwt from 'jsonwebtoken'

export function validateToken(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token requerido' })
  }

  try {
    const token = authHeader.slice(7)
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: payload.sub, role: payload.role }
    return next()
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' })
  }
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Rol no autorizado' })
    }

    return next()
  }
}
