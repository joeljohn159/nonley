export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="mb-8 text-[18px] font-medium text-neutral-900">
          Admin Panel
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
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
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <AdminSection
            title="User Management"
            description="Search and manage user accounts"
          />
          <AdminSection
            title="Bot Management"
            description="Create and manage marketing bots"
          />
          <AdminSection
            title="Analytics"
            description="Usage metrics and growth data"
          />
          <AdminSection
            title="Moderation"
            description="Review reported content and users"
          />
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
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <p className="text-[12px] text-neutral-400">{title}</p>
      <p className="mt-1 text-[28px] font-medium text-neutral-900">{count}</p>
      <p className="mt-1 text-[11px] text-neutral-400">{description}</p>
    </div>
  );
}

function AdminSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <h3 className="mb-2 text-[12px] font-medium uppercase tracking-wider text-neutral-400">
        {title}
      </h3>
      <p className="text-[13px] text-neutral-400">{description}</p>
    </section>
  );
}
