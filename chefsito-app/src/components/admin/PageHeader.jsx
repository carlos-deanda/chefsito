export default function PageHeader({ title, description }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-zinc-950 sm:text-2xl">{title}</h2>
      {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
    </div>
  )
}
