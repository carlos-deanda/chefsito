import { Router } from 'express'
import { query, getPool } from '../db/pool.js'
import { validateToken } from '../middleware/auth.js'

const router = Router()

// Aplicar token de seguridad para el demo académico
router.use(validateToken)

// GET /academic/cursos -> Obtener todos los cursos
router.get('/cursos', async (_req, res) => {
  try {
    const result = await query(`SELECT id, code, name, credits FROM cursos ORDER BY code`)
    return res.json({ cursos: result.rows })
  } catch (error) {
    console.error('get cursos error', error)
    return res.status(500).json({ message: 'Error al obtener los cursos' })
  }
})

// POST /academic/cursos -> Registrar un nuevo curso
router.post('/cursos', async (req, res) => {
  const { code, name, credits = 3 } = req.body

  if (!code?.trim() || !name?.trim()) {
    return res.status(400).json({ message: 'El código y el nombre del curso son requeridos' })
  }

  const parsedCredits = Number(credits)
  if (isNaN(parsedCredits) || parsedCredits <= 0) {
    return res.status(400).json({ message: 'Los créditos deben ser un número mayor a 0' })
  }

  try {
    const result = await query(
      `INSERT INTO cursos (code, name, credits)
       VALUES ($1, $2, $3)
       RETURNING id, code, name, credits`,
      [code.trim().toUpperCase(), name.trim(), parsedCredits],
    )
    return res.status(201).json({
      curso: result.rows[0],
      message: 'Curso registrado exitosamente',
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Ya existe un curso registrado con ese código' })
    }
    console.error('create curso error', error)
    return res.status(500).json({ message: 'Error al registrar el curso' })
  }
})

// GET /academic/estudiantes -> Obtener estudiantes e inscripciones (N:M agregada)
router.get('/estudiantes', async (_req, res) => {
  try {
    // Traer todos los estudiantes
    const studsResult = await query(`SELECT id, name, email, created_at FROM estudiantes ORDER BY name`)
    const students = studsResult.rows

    // Traer todas las relaciones de inscripción
    const enrollResult = await query(
      `SELECT ec.estudiante_id, ec.curso_id, ec.enrolled_at, c.code AS curso_code, c.name AS curso_name, c.credits AS curso_credits
       FROM estudiante_cursos ec
       JOIN cursos c ON c.id = ec.curso_id
       ORDER BY ec.enrolled_at DESC`,
    )
    const enrollments = enrollResult.rows

    // Mapear inscripciones a cada estudiante
    const studentsWithCourses = students.map((s) => ({
      ...s,
      cursos: enrollments
        .filter((e) => e.estudiante_id === s.id)
        .map((e) => ({
          id: e.curso_id,
          code: e.curso_code,
          name: e.curso_name,
          credits: e.curso_credits,
          enrolled_at: e.enrolled_at,
        })),
    }))

    return res.json({ estudiantes: studentsWithCourses })
  } catch (error) {
    console.error('get estudiantes error', error)
    return res.status(500).json({ message: 'Error al obtener los estudiantes' })
  }
})

// POST /academic/estudiantes -> Registrar un estudiante
router.post('/estudiantes', async (req, res) => {
  const { name, email } = req.body

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ message: 'El nombre y el correo son requeridos' })
  }

  // Validación de formato de email simple
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ message: 'El correo electrónico no es válido' })
  }

  try {
    const result = await query(
      `INSERT INTO estudiantes (name, email)
       VALUES ($1, $2)
       RETURNING id, name, email, created_at`,
      [name.trim(), email.trim().toLowerCase()],
    )
    return res.status(201).json({
      estudiante: result.rows[0],
      message: 'Estudiante registrado correctamente',
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Ya existe un estudiante con ese correo electrónico' })
    }
    console.error('create estudiante error', error)
    return res.status(500).json({ message: 'Error al registrar al estudiante' })
  }
})

// POST /academic/enroll -> Inscribir estudiante en curso (N:M inserción)
router.post('/enroll', async (req, res) => {
  const { estudiante_id, curso_id } = req.body

  if (!estudiante_id || !curso_id) {
    return res.status(400).json({ message: 'estudiante_id y curso_id son requeridos' })
  }

  try {
    const result = await query(
      `INSERT INTO estudiante_cursos (estudiante_id, curso_id)
       VALUES ($1, $2)
       RETURNING estudiante_id, curso_id, enrolled_at`,
      [estudiante_id, curso_id],
    )
    return res.status(201).json({
      enrollment: result.rows[0],
      message: 'Inscripción realizada con éxito',
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'El estudiante ya está inscrito en este curso' })
    }
    console.error('enroll error', error)
    return res.status(500).json({ message: 'Error al realizar la inscripción' })
  }
})

// DELETE /academic/enroll -> Dar de baja inscripción (N:M eliminación)
router.delete('/enroll', async (req, res) => {
  const { estudiante_id, curso_id } = req.body

  if (!estudiante_id || !curso_id) {
    return res.status(400).json({ message: 'estudiante_id y curso_id son requeridos en el cuerpo de la petición' })
  }

  try {
    const result = await query(
      `DELETE FROM estudiante_cursos
       WHERE estudiante_id = $1 AND curso_id = $2`,
      [estudiante_id, curso_id],
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Inscripción no encontrada' })
    }

    return res.status(200).json({ message: 'Estudiante dado de baja del curso correctamente' })
  } catch (error) {
    console.error('unenroll error', error)
    return res.status(500).json({ message: 'Error al dar de baja la inscripción' })
  }
})

export default router
