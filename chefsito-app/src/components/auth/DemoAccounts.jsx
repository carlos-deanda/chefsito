const demoAccounts = [
  { label: 'Admin', email: 'admin@chefsito.mx' },
  { label: 'Cliente', email: 'mariana@demo.mx' },
  { label: 'Recepcionista', email: 'recepcion@comalroma.mx' },
  { label: 'Gerente', email: 'gerente@comalroma.mx' },
  { label: 'Soporte', email: 'soporte@chefsito.mx' },
]

export default function DemoAccounts({ onSelect }) {
  return (
    <div>
      <p className="text-center text-xs text-zinc-500">Contraseña demo: password</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {demoAccounts.map((account) => (
          <button
            key={account.email}
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-white"
            onClick={() => onSelect(account.email)}
            type="button"
          >
            {account.label}
          </button>
        ))}
      </div>
    </div>
  )
}
