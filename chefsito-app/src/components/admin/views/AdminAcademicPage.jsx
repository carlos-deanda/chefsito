import { useState, useEffect } from 'react'
import { api } from '../../../api/client.js'
import PageHeader from '../PageHeader.jsx'

export default function AdminAcademicPage() {
  const [cursos, setCursos] = useState([])
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states
  const [newCurso, setNewCurso] = useState({ code: '', name: '', credits: 3 })
  const [newEstudiante, setNewEstudiante] = useState({ name: '', email: '' })
  const [enrollment, setEnrollment] = useState({ estudiante_id: '', curso_id: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [curRes, estRes] = await Promise.all([
        api('/academic/cursos'),
        api('/academic/estudiantes'),
      ])
      setCursos(curRes.cursos || [])
      setEstudiantes(estRes.estudiantes || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreateCurso = async (e) => {
    e.preventDefault()
    if (!newCurso.code.trim() || !newCurso.name.trim()) return
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const res = await api('/academic/cursos', {
        method: 'POST',
        body: JSON.stringify(newCurso),
      })
      setSuccess(res.message || 'Curso registrado correctamente.')
      setNewCurso({ code: '', name: '', credits: 3 })
      await fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateEstudiante = async (e) => {
    e.preventDefault()
    if (!newEstudiante.name.trim() || !newEstudiante.email.trim()) return
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const res = await api('/academic/estudiantes', {
        method: 'POST',
        body: JSON.stringify(newEstudiante),
      })
      setSuccess(res.message || 'Estudiante registrado correctamente.')
      setNewEstudiante({ name: '', email: '' })
      await fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEnroll = async (e) => {
    e.preventDefault()
    if (!enrollment.estudiante_id || !enrollment.curso_id) return
    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const res = await api('/academic/enroll', {
        method: 'POST',
        body: JSON.stringify(enrollment),
      })
      setSuccess(res.message || 'Estudiante inscrito al curso exitosamente.')
      setEnrollment({ estudiante_id: '', curso_id: '' })
      await fetchData()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnenroll = async (estudianteId, cursoId) => {
    if (!window.confirm('¿Seguro que deseas dar de baja esta inscripción?')) return

    try {
      const res = await api('/academic/enroll', {
        method: 'DELETE',
        body: JSON.stringify({ estudiante_id: estudianteId, curso_id: cursoId }),
      })
      alert(res?.message || 'Baja realizada.')
      await fetchData()
    } catch (err) {
      alert(`Error al dar de baja: ${err.message}`)
    }
  }

  return (
    <>
      <PageHeader
        description="Panel de prueba académica para evidenciar e interactuar con la relación de muchos a muchos (N:M) entre estudiantes y cursos."
        title="Demostración N:M Académica"
      />

      {error && (
        <p className="mb-6 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-600 ring-1 ring-red-500/20">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-6 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 ring-1 ring-emerald-500/20">
          {success}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Registro de Cursos */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-zinc-950 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2">
            📘 Registrar Curso
          </h3>
          <form onSubmit={handleCreateCurso} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Clave del Curso</label>
              <input
                type="text"
                placeholder="Ej. TC2007B"
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                value={newCurso.code}
                onChange={(e) => setNewCurso({ ...newCurso, code: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nombre de Materia</label>
              <input
                type="text"
                placeholder="Ej. Construcción de Software"
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                value={newCurso.name}
                onChange={(e) => setNewCurso({ ...newCurso, name: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Créditos</label>
              <input
                type="number"
                min="1"
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                value={newCurso.credits}
                onChange={(e) => setNewCurso({ ...newCurso, credits: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-violet-700 hover:bg-violet-850 py-2.5 text-sm font-semibold text-white transition shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
            >
              Registrar Curso
            </button>
          </form>
        </section>

        {/* Registro de Estudiantes */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-zinc-950 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2">
            👨‍🎓 Registrar Estudiante
          </h3>
          <form onSubmit={handleCreateEstudiante} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Nombre Completo</label>
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                value={newEstudiante.name}
                onChange={(e) => setNewEstudiante({ ...newEstudiante, name: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Correo Electrónico</label>
              <input
                type="email"
                placeholder="Ej. juan@tec.mx"
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                value={newEstudiante.email}
                onChange={(e) => setNewEstudiante({ ...newEstudiante, email: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-violet-700 hover:bg-violet-850 py-2.5 text-sm font-semibold text-white transition shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
            >
              Registrar Estudiante
            </button>
          </form>
        </section>

        {/* Inscripción (Relación de Unión N:M) */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-zinc-950 border-b border-zinc-100 pb-3 mb-4 flex items-center gap-2">
            🔗 Inscribir (Unión N:M)
          </h3>
          <form onSubmit={handleEnroll} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Seleccionar Estudiante</label>
              <select
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                value={enrollment.estudiante_id}
                onChange={(e) => setEnrollment({ ...enrollment, estudiante_id: e.target.value })}
              >
                <option value="">-- Elige un estudiante --</option>
                {estudiantes.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.name} ({est.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Seleccionar Curso</label>
              <select
                required
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-sm text-zinc-950 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100"
                value={enrollment.curso_id}
                onChange={(e) => setEnrollment({ ...enrollment, curso_id: e.target.value })}
              >
                <option value="">-- Elige un curso --</option>
                {cursos.map((cur) => (
                  <option key={cur.id} value={cur.id}>
                    [{cur.code}] {cur.name} ({cur.credits} cr.)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting || !enrollment.estudiante_id || !enrollment.curso_id}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-750 py-2.5 text-sm font-semibold text-white transition shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
            >
              Realizar Inscripción
            </button>
          </form>
        </section>
      </div>

      {/* Listas y Relación N:M Activa */}
      <div className="grid gap-6 mt-6 lg:grid-cols-[1fr_2fr]">
        {/* Catálogo de Cursos */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-zinc-950 border-b border-zinc-100 pb-3 mb-4">
            Catálogo de Cursos ({cursos.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {cursos.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-55/30 p-3">
                <div>
                  <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-xs font-bold text-violet-750 border border-violet-100 uppercase tracking-wide">
                    {c.code}
                  </span>
                  <h4 className="mt-1 font-semibold text-zinc-950 text-sm">{c.name}</h4>
                </div>
                <span className="text-xs font-bold text-zinc-500">{c.credits} créditos</span>
              </div>
            ))}
            {cursos.length === 0 && (
              <p className="py-8 text-center text-xs text-zinc-400 italic">No hay cursos registrados.</p>
            )}
          </div>
        </section>

        {/* Inscripciones N:M Estudiantes <-> Cursos */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-zinc-950 border-b border-zinc-100 pb-3 mb-4">
            Matrícula de Estudiantes e Inscripciones Activas
          </h3>

          {loading ? (
            <div className="py-12 text-center text-sm text-zinc-500">Cargando matrícula...</div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {estudiantes.map((est) => (
                <div key={est.id} className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 space-y-3 hover:shadow-xs transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-zinc-950 text-sm">{est.name}</h4>
                      <p className="text-xs text-zinc-500">{est.email}</p>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                      ID: {est.id.slice(0, 8)}...
                    </span>
                  </div>

                  {/* Listado de cursos inscritos en N:M */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Cursos inscritos ({est.cursos?.length || 0}):</p>
                    {est.cursos && est.cursos.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {est.cursos.map((c) => (
                          <div key={c.id} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50/40 px-2.5 py-1 text-xs font-medium text-emerald-850">
                            <span>[{c.code}] {c.name}</span>
                            <button
                              onClick={() => handleUnenroll(est.id, c.id)}
                              className="rounded-full p-0.5 text-emerald-500 hover:bg-emerald-100 hover:text-emerald-700 cursor-pointer"
                              title="Dar de baja"
                              type="button"
                            >
                              ❌
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 italic">Este estudiante no está inscrito en ninguna materia.</p>
                    )}
                  </div>
                </div>
              ))}
              {estudiantes.length === 0 && (
                <p className="py-12 text-center text-sm text-zinc-500">No hay estudiantes registrados.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
