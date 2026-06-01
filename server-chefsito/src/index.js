import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'

const app = express()
const server = createServer(app)
const port = process.env.PORT ?? 4000
const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://127.0.0.1:5173'

const io = new Server(server, {
  cors: {
    origin: clientOrigin,
  },
})

app.use(cors({ origin: clientOrigin }))
app.use(express.json())

const restaurants = [
  {
    id: 'r1',
    name: 'Comal Roma',
    address: 'Orizaba 86, Roma Norte',
    lat: 19.4189,
    lng: -99.1611,
    table_count: 18,
    status: 'open',
    estimated_wait_minutes: 18,
    people_waiting: 14,
  },
  {
    id: 'r2',
    name: 'Nori Condesa',
    address: 'Amsterdam 214, Condesa',
    lat: 19.4114,
    lng: -99.1715,
    table_count: 12,
    status: 'paused',
    estimated_wait_minutes: 26,
    people_waiting: 21,
  },
]

const waitlistEntries = []

function notImplemented(res, feature) {
  return res.status(501).json({
    message: `${feature} pendiente de conectar a Supabase/autenticacion real`,
  })
}

function validateToken(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token requerido' })
  }

  req.user = {
    id: 'demo-user',
    role: req.headers['x-demo-role'] ?? 'cliente',
  }

  return next()
}

function checkRole(expectedRole) {
  return (req, res, next) => {
    if (req.user?.role !== expectedRole) {
      return res.status(403).json({ message: 'Rol no autorizado' })
    }

    return next()
  }
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'server-chefsito' })
})

app.post('/auth/register', (req, res) => {
  const { name, email, phone, role } = req.body

  if (!name || !email || !phone || !role) {
    return res.status(400).json({ message: 'Faltan campos requeridos' })
  }

  return res.status(201).json({
    user: { id: 'demo-user', name, email, phone, role },
    access_token: 'demo-access-token',
    refresh_token: 'demo-refresh-token',
  })
})

app.post('/auth/login', (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ message: 'Email requerido' })
  }

  return res.json({
    user: { id: 'demo-user', email, name: 'Demo Ahorita', role: 'cliente' },
    access_token: 'demo-access-token',
    refresh_token: 'demo-refresh-token',
  })
})

app.post('/auth/logout', validateToken, (_req, res) => {
  res.status(204).send()
})

app.get('/auth/profile/:id', validateToken, (req, res) => {
  res.json({ id: req.params.id, name: 'Demo Ahorita', role: req.user.role })
})

app.put('/auth/profile', validateToken, (_req, res) => {
  notImplemented(res, 'Actualizacion de perfil')
})

app.post('/restaurants', validateToken, checkRole('restaurante'), (req, res) => {
  const restaurant = {
    id: `r${restaurants.length + 1}`,
    status: 'open',
    ...req.body,
  }

  restaurants.push(restaurant)
  io.emit('restaurant:status', { restaurant_id: restaurant.id, status: restaurant.status })

  res.status(201).json(restaurant)
})

app.get('/restaurants/nearby', validateToken, checkRole('cliente'), (_req, res) => {
  res.json({ restaurants })
})

app.get('/restaurants/:id/waitlist', validateToken, checkRole('restaurante'), (req, res) => {
  res.json({
    restaurant_id: req.params.id,
    waitlist: waitlistEntries.filter((entry) => entry.restaurant_id === req.params.id),
  })
})

app.put('/restaurants/:id/status', validateToken, checkRole('restaurante'), (req, res) => {
  const restaurant = restaurants.find((item) => item.id === req.params.id)

  if (!restaurant) {
    return res.status(404).json({ message: 'Restaurante no encontrado' })
  }

  restaurant.status = req.body.status
  io.emit('restaurant:status', { restaurant_id: restaurant.id, status: restaurant.status })

  return res.json(restaurant)
})

app.post('/waitlist', validateToken, checkRole('cliente'), (req, res) => {
  const duplicate = waitlistEntries.find(
    (entry) =>
      entry.user_id === req.user.id &&
      entry.restaurant_id === req.body.restaurant_id &&
      entry.status === 'waiting',
  )

  if (duplicate) {
    return res.status(409).json({ message: 'Ya estas en la fila de este restaurante' })
  }

  const entry = {
    id: `w${waitlistEntries.length + 1}`,
    user_id: req.user.id,
    restaurant_id: req.body.restaurant_id,
    party_size: req.body.party_size,
    status: 'waiting',
    position: waitlistEntries.length + 1,
    registered_at: new Date().toISOString(),
  }

  waitlistEntries.push(entry)
  io.emit('waitlist:updated', {
    restaurant_id: entry.restaurant_id,
    waitlist: waitlistEntries.filter((item) => item.restaurant_id === entry.restaurant_id),
  })

  return res.status(201).json(entry)
})

app.delete('/waitlist/:id', validateToken, checkRole('cliente'), (req, res) => {
  const index = waitlistEntries.findIndex((entry) => entry.id === req.params.id)

  if (index === -1) {
    return res.status(404).json({ message: 'Turno no encontrado' })
  }

  const [entry] = waitlistEntries.splice(index, 1)
  io.emit('waitlist:updated', {
    restaurant_id: entry.restaurant_id,
    waitlist: waitlistEntries.filter((item) => item.restaurant_id === entry.restaurant_id),
  })

  return res.status(204).send()
})

app.put('/waitlist/:id/confirm', validateToken, checkRole('cliente'), (req, res) => {
  const entry = waitlistEntries.find((item) => item.id === req.params.id)

  if (!entry) {
    return res.status(404).json({ message: 'Turno no encontrado' })
  }

  entry.status = 'arrived'

  return res.json(entry)
})

app.post('/waitlist/:id/call-next', validateToken, checkRole('restaurante'), (req, res) => {
  const entry = waitlistEntries.find((item) => item.id === req.params.id)

  if (!entry) {
    return res.status(404).json({ message: 'Turno no encontrado' })
  }

  entry.status = 'called'
  entry.called_at = new Date().toISOString()
  io.emit('entry:called', { entry_id: entry.id, user_id: entry.user_id })

  return res.json(entry)
})

app.get('/waitlist/:id/position', validateToken, checkRole('cliente'), (req, res) => {
  const entry = waitlistEntries.find((item) => item.id === req.params.id)

  if (!entry) {
    return res.status(404).json({ message: 'Turno no encontrado' })
  }

  return res.json({ id: entry.id, position: entry.position, status: entry.status })
})

app.get('/notifications/:entry_id/history', validateToken, (_req, res) => {
  res.json({ notifications: [] })
})

app.get('/analytics/:restaurant_id/daily', validateToken, checkRole('restaurante'), (req, res) => {
  res.json({
    restaurant_id: req.params.restaurant_id,
    date: req.query.date ?? new Date().toISOString().slice(0, 10),
    total_entries: 184,
    no_shows: 12,
    avg_wait_minutes: 17,
    peak_hour: 14,
  })
})

app.get('/analytics/:restaurant_id/peak-hours', validateToken, checkRole('restaurante'), (_req, res) => {
  res.json({ hours: [{ hour: 14, entries: 44 }] })
})

app.get('/analytics/:restaurant_id/no-show-rate', validateToken, checkRole('restaurante'), (_req, res) => {
  res.json({ no_show_rate: 0.064 })
})

io.on('connection', (socket) => {
  socket.on('restaurant:join', (restaurantId) => {
    socket.join(restaurantId)
  })
})

server.listen(port, () => {
  console.log(`server-chefsito listening on http://localhost:${port}`)
})
