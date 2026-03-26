export default function AdminPage() {
  return (
    <main className="bg-nonley-bg min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="mb-8 text-2xl font-semibold">Admin Panel</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <AdminCard
            title="Users"
            count={0}
            description="Total registered users"
          />
          <AdminCard
            title="Active Bots"
            count={0}
            description="Marketing bots currently running"
          />
          <AdminCard
            title="Active Rooms"
            count={0}
            description="Rooms with 1+ users"
          />
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="border-nonley-border bg-nonley-surface rounded-xl border p-6">
            <h3 className="text-nonley-text-muted mb-4 text-sm font-semibold uppercase tracking-wider">
              User Management
            </h3>
            <p className="text-nonley-text-muted text-sm">
              Search and manage user accounts
            </p>
          </section>
          <section className="border-nonley-border bg-nonley-surface rounded-xl border p-6">
            <h3 className="text-nonley-text-muted mb-4 text-sm font-semibold uppercase tracking-wider">
              Bot Management
            </h3>
            <p className="text-nonley-text-muted text-sm">
              Create and manage marketing bots
            </p>
          </section>
          <section className="border-nonley-border bg-nonley-surface rounded-xl border p-6">
            <h3 className="text-nonley-text-muted mb-4 text-sm font-semibold uppercase tracking-wider">
              Analytics
            </h3>
            <p className="text-nonley-text-muted text-sm">
              Usage metrics and growth data
            </p>
          </section>
          <section className="border-nonley-border bg-nonley-surface rounded-xl border p-6">
            <h3 className="text-nonley-text-muted mb-4 text-sm font-semibold uppercase tracking-wider">
              Moderation
            </h3>
            <p className="text-nonley-text-muted text-sm">
              Review reported content and users
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

function AdminCard({
  title,
  count,
  description,
}: {
  title: string;
  count: number;
  description: string;
}) {
  return (
    <div className="border-nonley-border bg-nonley-surface rounded-xl border p-6">
      <p className="text-nonley-text-muted text-sm">{title}</p>
      <p className="mt-1 text-3xl font-bold">{count}</p>
      <p className="text-nonley-text-muted mt-1 text-xs">{description}</p>
    </div>
  );
}
