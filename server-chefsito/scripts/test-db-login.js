import 'dotenv/config'
import bcrypt from 'bcrypt'
import pg from 'pg'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL no está definida en .env')
  process.exit(1)
}

console.log('Conectando a:', process.env.DATABASE_URL.split('@')[1] || 'localhost')

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })

try {
  await client.connect()
  const result = await client.query('SELECT id, email, role, password_hash, is_active FROM users')
  
  console.log(`\nUsuarios encontrados en la base de datos (${result.rowCount}):`)
  for (const row of result.rows) {
    const isValid = await bcrypt.compare('password', row.password_hash)
    console.log(`- Email: ${row.email} | Rol: ${row.role} | ¿Cifrado con "password"?: ${isValid ? 'SÍ ✅' : 'NO ❌'} | Activo: ${row.is_active}`)
  }
} catch (error) {
  console.error('Error al consultar la base de datos:', error.message)
} finally {
  await client.end()
}
