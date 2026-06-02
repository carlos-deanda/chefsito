export function AuthField({ label, id, type = 'text', value, onChange, placeholder, required, trailing }) {
  return (
    <label className="grid gap-2" htmlFor={id}>
      <span className="text-sm font-medium text-white">{label}</span>
      <div className="relative">
        <input
          className="w-full rounded-xl border-0 bg-white px-4 py-3 text-sm text-zinc-900 outline-none ring-2 ring-transparent placeholder:text-zinc-400 focus:ring-orange-500"
          id={id}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          type={type}
          value={value}
        />
        {trailing}
      </div>
    </label>
  )
}

export function PasswordToggle({ visible, onToggle }) {
  return (
    <button
      aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
      onClick={onToggle}
      type="button"
    >
      {visible ? (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M3 3l18 18M10.58 10.58A2 2 0 0012 15a2 2 0 001.42-.58M9.88 4.24A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7a11.8 11.8 0 01-4.12 4.88M6.23 6.23A11.72 11.72 0 001 12c1.73 3.89 6 7 11 7 1.29 0 2.52-.2 3.66-.57" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  )
}

export function AuthButton({ children, loading, type = 'submit' }) {
  return (
    <button
      className="mt-2 w-full rounded-xl bg-[#f15a24] py-3.5 text-sm font-bold text-white transition hover:bg-[#e04f1c] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={loading}
      type={type}
    >
      {children}
    </button>
  )
}

export function AuthDivider({ children }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/10" />
      </div>
      <p className="relative mx-auto w-fit bg-[#141414] px-3 text-xs text-zinc-500">{children}</p>
    </div>
  )
}
