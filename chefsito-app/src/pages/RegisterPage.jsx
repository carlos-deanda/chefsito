import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import { AuthButton, AuthField, PasswordToggle } from '../components/auth/AuthField.jsx'

export default function RegisterPage({ onGoLogin }) {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('password')
  const [showPassword, setShowPassword] = useState(false)
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
    <AuthLayout>
      <h1 className="text-center text-3xl font-bold text-white">Registrarse</h1>
      <p className="mt-2 text-center text-sm text-zinc-500">Cuenta de cliente</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-center text-sm text-red-400 ring-1 ring-red-500/30">
            {error}
          </p>
        )}

        <AuthField
          id="name"
          label="Nombre"
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          required
          value={name}
        />

        <AuthField
          id="email"
          label="Email"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="username@gmail.com"
          required
          type="email"
          value={email}
        />

        <AuthField
          id="phone"
          label="Teléfono"
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+52 ..."
          type="tel"
          value={phone}
        />

        <AuthField
          id="password"
          label="Contraseña"
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          required
          trailing={
            <PasswordToggle onToggle={() => setShowPassword((v) => !v)} visible={showPassword} />
          }
          type={showPassword ? 'text' : 'password'}
          value={password}
        />

        <AuthButton loading={loading}>{loading ? 'Creando…' : 'Crear cuenta'}</AuthButton>
      </form>

      <p className="mt-8 text-center text-sm text-zinc-400">
        ¿Ya tienes cuenta?{' '}
        <button
          className="font-semibold text-white underline-offset-2 hover:text-orange-400 hover:underline"
          onClick={onGoLogin}
          type="button"
        >
          Iniciar sesión
        </button>
      </p>
    </AuthLayout>
  )
}
