import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import pg from 'pg'

const file = process.argv[2]

if (!file) {
  console.error('Uso: node scripts/run-sql.js database/schema.sql')
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL no está definida en .env')
  process.exit(1)
}

const sql = await readFile(resolve(file), 'utf8')
const client = new pg.Client({ connectionString: process.env.DATABASE_URL })

try {
  await client.connect()
  await client.query(sql)
  console.log(`OK: ${file}`)
} catch (error) {
  console.error(`Error en ${file}:`, error.message)
  process.exit(1)
} finally {
  await client.end()
}
