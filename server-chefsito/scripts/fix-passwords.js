import 'dotenv/config'
import bcrypt from 'bcrypt'
import pg from 'pg'

const DEMO_PASSWORD = 'password'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL no está definida en .env')
  process.exit(1)
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })

try {
  await client.connect()
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10)
  const result = await client.query(
    `UPDATE users SET password_hash = $1 WHERE is_active = TRUE`,
    [hash],
  )
  console.log(`OK: ${result.rowCount} usuarios actualizados. Contraseña demo: "${DEMO_PASSWORD}"`)
} catch (error) {
  console.error('Error:', error.message)
  process.exit(1)
} finally {
  await client.end()
}
