import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { checkDatabaseConnection } from './db/pool.js'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import restaurantRoutes from './routes/restaurants.js'
import waitlistRoutes from './routes/waitlist.js'
import soporteRoutes from './routes/soporte.js'
import analyticsRoutes from './routes/analytics.js'

const app = express()
const server = createServer(app)
const port = process.env.PORT ?? 4000

// localhost y 127.0.0.1 son orígenes distintos para el navegador
const allowedOrigins = [
  ...(process.env.CLIENT_ORIGIN?.split(',').map((o) => o.trim()) ?? []),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter((value, index, list) => list.indexOf(value) === index)

function corsOrigin(origin, callback) {
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true)
    return
  }
  callback(null, false)
}

const corsOptions = {
  origin: corsOrigin,
  credentials: true,
}

const io = new Server(server, {
  cors: corsOptions,
})

app.use(cors(corsOptions))
app.use(express.json())
app.set('io', io)

app.get('/health', async (_req, res) => {
  const payload = { ok: true, service: 'server-chefsito' }

  if (process.env.DATABASE_URL) {
    try {
      payload.database = await checkDatabaseConnection()
    } catch (error) {
      return res.status(503).json({
        ok: false,
        service: 'server-chefsito',
        database_error: error.message,
      })
    }
  }

  res.json(payload)
})

app.use('/auth', authRoutes)
app.use('/admin', adminRoutes)
app.use('/restaurants', restaurantRoutes)
app.use('/waitlist', waitlistRoutes)
app.use('/soporte', soporteRoutes)
app.use('/analytics', analyticsRoutes)

io.on('connection', (socket) => {
  socket.on('restaurant:join', (restaurantId) => {
    socket.join(restaurantId)
  })
})

server.listen(port, () => {
  console.log(`server-chefsito listening on http://localhost:${port}`)
})
