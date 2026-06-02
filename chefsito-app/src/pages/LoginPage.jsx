import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import DemoAccounts from '../components/auth/DemoAccounts.jsx'
import { AuthButton, AuthDivider, AuthField, PasswordToggle } from '../components/auth/AuthField.jsx'

export default function LoginPage({ onGoRegister }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('password')
  const [showPassword, setShowPassword] = useState(false)
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
    <AuthLayout>
      <h1 className="text-center text-3xl font-bold text-white">Iniciar sesión</h1>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        {error && (
          <p className="rounded-xl bg-red-500/10 px-3 py-2 text-center text-sm text-red-400 ring-1 ring-red-500/30">
            {error}
          </p>
        )}

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

        <AuthButton loading={loading}>{loading ? 'Entrando…' : 'Entrar'}</AuthButton>
      </form>

      <AuthDivider>o prueba con</AuthDivider>

      <DemoAccounts onSelect={fillDemo} />

      <p className="mt-8 text-center text-sm text-zinc-400">
        ¿No tienes cuenta?{' '}
        <button
          className="font-semibold text-white underline-offset-2 hover:text-orange-400 hover:underline"
          onClick={onGoRegister}
          type="button"
        >
          Regístrate gratis
        </button>
      </p>
    </AuthLayout>
  )
}
