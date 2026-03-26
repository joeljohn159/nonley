export default function ProfilePage({ params }: { params: { id: string } }) {
  return (
    <main className="bg-nonley-bg min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="border-nonley-border bg-nonley-surface rounded-xl border p-8">
          <div className="mb-6 flex items-center gap-4">
            <div className="bg-nonley-border h-16 w-16 rounded-full" />
            <div>
              <h2 className="text-xl font-semibold">User Profile</h2>
              <p className="text-nonley-text-muted text-sm">ID: {params.id}</p>
            </div>
          </div>
          <div className="space-y-4">
            <Section title="Currently Browsing" content="Opt-in feature" />
            <Section title="Interests" content="Auto-generated + manual tags" />
            <Section title="Circles" content="Shared circles appear here" />
            <Section
              title="Web Trail"
              content="Public breadcrumb of recent reads"
            />
          </div>
          <div className="mt-6">
            <button className="bg-nonley-accent hover:bg-nonley-accent-hover rounded-lg px-6 py-2 text-sm font-medium text-white transition-colors">
              Wave 👋
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h3 className="text-nonley-text-muted text-xs font-semibold uppercase tracking-wider">
        {title}
      </h3>
      <p className="text-nonley-text-muted mt-1 text-sm">{content}</p>
    </div>
  );
}
