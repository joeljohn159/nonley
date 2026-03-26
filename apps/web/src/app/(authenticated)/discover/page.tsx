export default function DiscoverPage() {
  return (
    <main className="bg-nonley-bg min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="mb-8 text-2xl font-semibold">Discover</h2>
        <div className="mb-8">
          <input
            type="search"
            placeholder="Search circles, topics, people..."
            className="border-nonley-border bg-nonley-surface text-nonley-text placeholder:text-nonley-text-muted focus:border-nonley-accent w-full rounded-lg border px-4 py-3 text-sm focus:outline-none"
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <DiscoverSection title="Trending URLs" />
          <DiscoverSection title="Popular Circles" />
          <DiscoverSection title="People Like You" />
          <DiscoverSection title="By Location" />
        </div>
      </div>
    </main>
  );
}

function DiscoverSection({ title }: { title: string }) {
  return (
    <div className="border-nonley-border bg-nonley-surface rounded-xl border p-6">
      <h3 className="text-nonley-text-muted mb-4 text-sm font-semibold uppercase tracking-wider">
        {title}
      </h3>
      <p className="text-nonley-text-muted text-sm">Coming soon</p>
    </div>
  );
}
