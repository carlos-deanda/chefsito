import CreateStaffForm from '../../CreateStaffForm.jsx'
import StaffList from '../StaffList.jsx'
import PageHeader from '../PageHeader.jsx'

export default function AdminStaffPage({ users, restaurants, onCreated }) {
  return (
    <>
      <PageHeader
        description="Crea cuentas de recepcionistas, gerentes, soporte y administradores."
        title="Staff"
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <CreateStaffForm onCreated={onCreated} restaurants={restaurants} />
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h3 className="font-semibold text-zinc-950">
              Personal del sistema ({users.length})
            </h3>
          </div>
          <div className="max-h-[calc(100vh-16rem)] overflow-y-auto">
            <StaffList users={users} />
          </div>
        </section>
      </div>
    </>
  )
}
