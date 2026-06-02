import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const demoAccounts = [
  { label: 'Admin', email: 'admin@chefsito.mx' },
  { label: 'Cliente', email: 'mariana@demo.mx' },
  { label: 'Recepcionista', email: 'recepcion@comalroma.mx' },
  { label: 'Gerente', email: 'gerente@comalroma.mx' },
  { label: 'Soporte', email: 'soporte@chefsito.mx' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(accountEmail) {
    setEmail(accountEmail)
    setPassword('password')
    setError('')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-zinc-950">Chefsito</h1>
          <p className="mt-2 text-sm text-zinc-500">Filas de espera para restaurantes</p>
        </div>

        <form
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
          onSubmit={handleSubmit}
        >
          <h2 className="text-xl font-semibold text-zinc-950">Iniciar sesión</h2>
          <p className="mt-1 text-sm text-zinc-500">Usa tu cuenta según tu rol en el sistema</p>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </p>
          )}

          <label className="mt-5 grid gap-1.5 text-sm font-medium text-zinc-700">
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
            className="mt-6 w-full rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-zinc-700">Cuentas demo (contraseña: password)</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-orange-300 hover:bg-orange-50"
                onClick={() => fillDemo(account.email)}
                type="button"
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
