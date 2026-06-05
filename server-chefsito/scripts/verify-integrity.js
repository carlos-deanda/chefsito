import 'dotenv/config'
import pg from 'pg'

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL no está definida en .env')
  process.exit(1)
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })

async function runTests() {
  console.log('=== Iniciando verificación de integridad relacional ===')
  
  try {
    await client.connect()
    
    // 1. Crear un usuario de prueba
    console.log('\n[Paso 1] Creando usuario de prueba...');
    const userRes = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ('Usuario Test Integridad', 'test-integridad@chefsito.mx', 'hash_dummy', 'usuario')
       RETURNING id, name`
    )
    const userId = userRes.rows[0].id
    console.log(`✓ Usuario creado exitosamente. ID: ${userId}`)

    // 2. Crear perfil asociado (Verificación Relación 1:1)
    console.log('\n[Paso 2] Creando perfil de usuario (Relación 1:1)...');
    const profileRes = await client.query(
      `INSERT INTO user_profiles (user_id, bio, avatar_url, preferences)
       VALUES ($1, 'Biografía de prueba de integridad', 'https://avatar.png', '{"theme": "dark"}')
       RETURNING user_id, bio`,
      [userId]
    )
    console.log(`✓ Perfil creado asociado al usuario ${profileRes.rows[0].user_id}`)

    // Intentar duplicar perfil para el mismo usuario (debe fallar por PK única en 1:1)
    try {
      console.log('Intentando insertar un segundo perfil para el mismo usuario (debe fallar)...');
      await client.query(
        `INSERT INTO user_profiles (user_id, bio) VALUES ($1, 'Segundo perfil fraudulento')`,
        [userId]
      )
      console.error('❌ ERROR: Se permitió crear un segundo perfil en relación 1:1.');
      process.exit(1);
    } catch (e) {
      console.log(`✓ OK: La base de datos impidió el duplicado correctamente. Razón: ${e.message}`);
    }

    // 3. Crear una publicación asociada (Verificación Relación 1:N)
    console.log('\n[Paso 3] Creando publicación (Relación 1:N)...');
    const postRes = await client.query(
      `INSERT INTO publicaciones (user_id, title, content)
       VALUES ($1, 'Título de Prueba', 'Contenido de la publicación de prueba.')
       RETURNING id, title`,
      [userId]
    )
    const postId = postRes.rows[0].id
    console.log(`✓ Publicación creada exitosamente. ID: ${postId}, Título: "${postRes.rows[0].title}"`)

    // 4. Crear demostración de amenidades y asignaciones (Verificación Relación N:M)
    console.log('\n[Paso 4] Creando relación de amenidades (Relación N:M Restaurantes <-> Amenidades)...');
    
    const restTestRes = await client.query(
      `INSERT INTO restaurants (name, cuisine, address, lat, lng, table_count)
       VALUES ('Restaurante Test Integridad', 'Prueba', 'Calle Falsa 123', 20.73, -103.45, 10)
       RETURNING id`
    )
    const restTestId = restTestRes.rows[0].id
    
    const amenityRes = await client.query(
      `INSERT INTO amenities (name, description)
       VALUES ('Amenidad Test Integridad', 'Servicio de prueba de base de datos')
       RETURNING id`
    )
    const amenityId = amenityRes.rows[0].id
 
    console.log(`Restaurante de prueba creado ID: ${restTestId}`)
    console.log(`Amenidad de prueba creada ID: ${amenityId}`)
 
    // Asociar en la tabla de unión
    await client.query(
      `INSERT INTO restaurant_amenities (restaurant_id, amenity_id) VALUES ($1, $2)`,
      [restTestId, amenityId]
    )
    console.log('✓ Asociación N:M en restaurant_amenities realizada correctamente.')
 
    // 5. Verificar borrado en cascada (Cascade Deletes)
    console.log('\n[Paso 5] Verificando borrado en cascada (ON DELETE CASCADE)...');
    
    console.log('Eliminando al usuario principal de prueba...');
    await client.query(`DELETE FROM users WHERE id = $1`, [userId])
    console.log('✓ Usuario eliminado.')
 
    // Verificar si el perfil fue eliminado en cascada
    const checkProfile = await client.query(`SELECT * FROM user_profiles WHERE user_id = $1`, [userId])
    if (checkProfile.rowCount === 0) {
      console.log('✓ Perfil 1:1 eliminado en cascada correctamente.')
    } else {
      console.error('❌ ERROR: El perfil 1:1 no fue eliminado en cascada.')
      process.exit(1)
    }
 
    // Verificar si la publicación fue eliminada en cascada
    const checkPost = await client.query(`SELECT * FROM publicaciones WHERE id = $1`, [postId])
    if (checkPost.rowCount === 0) {
      console.log('✓ Publicación 1:N eliminada en cascada correctamente.')
    } else {
      console.error('❌ ERROR: La publicación 1:N no fue eliminada en cascada.')
      process.exit(1)
    }
 
    console.log('\nEliminando al restaurante de prueba para verificar cascada N:M...');
    await client.query(`DELETE FROM restaurants WHERE id = $1`, [restTestId])
    
    // Verificar si la asociación fue eliminada en cascada
    const checkLink = await client.query(
      `SELECT * FROM restaurant_amenities WHERE restaurant_id = $1 AND amenity_id = $2`,
      [restTestId, amenityId]
    )
    if (checkLink.rowCount === 0) {
      console.log('✓ Asociación N:M en restaurant_amenities eliminada en cascada correctamente.')
    } else {
      console.error('❌ ERROR: La asociación N:M no fue eliminada en cascada.')
      process.exit(1)
    }
 
    // Limpiar la amenidad de prueba
    await client.query(`DELETE FROM amenities WHERE id = $1`, [amenityId])
 
    console.log('\n======================================================');
    console.log('🎉 ¡TODAS LAS PRUEBAS DE INTEGRIDAD PASARON CON ÉXITO! 🎉');
    console.log('======================================================');
    process.exit(0)

  } catch (error) {
    console.error('❌ ERROR DURANTE LA VERIFICACIÓN DE INTEGRIDAD:', error.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runTests()
