import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function RegisterPage({ onGoLogin }) {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await register({ name, email, phone, password })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-zinc-950">Chefsito</h1>
          <p className="mt-2 text-sm text-zinc-500">Crea tu cuenta de cliente</p>
        </div>

        <form
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <h2 className="text-xl font-semibold text-zinc-950">Registrarse</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Solo para clientes. El personal del restaurante recibe su cuenta del administrador.
          </p>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </p>
          )}

          <label className="mt-5 grid gap-1.5 text-sm font-medium text-zinc-700">
            Nombre
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2.5 outline-none ring-orange-500 focus:ring-2"
              onChange={(e) => setName(e.target.value)}
              required
              value={name}
            />
          </label>

          <label className="mt-4 grid gap-1.5 text-sm font-medium text-zinc-700">
            Email
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2.5 outline-none ring-orange-500 focus:ring-2"
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              value={email}
            />
          </label>

          <label className="mt-4 grid gap-1.5 text-sm font-medium text-zinc-700">
            Teléfono
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2.5 outline-none ring-orange-500 focus:ring-2"
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              value={phone}
            />
          </label>

          <label className="mt-4 grid gap-1.5 text-sm font-medium text-zinc-700">
            Contraseña
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2.5 outline-none ring-orange-500 focus:ring-2"
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          <button
            className="mt-6 w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>

          <p className="mt-4 text-center text-sm text-zinc-600">
            ¿Ya tienes cuenta?{' '}
            <button
              className="font-semibold text-orange-600 hover:text-orange-700"
              onClick={onGoLogin}
              type="button"
            >
              Iniciar sesión
            </button>
          </p>
        </form>
      </div>
    </main>
  )
}
