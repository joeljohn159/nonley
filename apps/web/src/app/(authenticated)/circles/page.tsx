export default function CirclesPage() {
  return (
    <main className="bg-nonley-bg min-h-screen">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Your Circles</h2>
          <button className="bg-nonley-accent hover:bg-nonley-accent-hover rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors">
            Create Circle
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 text-6xl opacity-20">⭕</div>
          <p className="text-nonley-text-muted text-lg">No circles yet.</p>
          <p className="text-nonley-text-muted mt-2 text-sm">
            Circles form around shared browsing patterns, interests, or you can
            create them manually.
          </p>
        </div>
      </div>
    </main>
  );
}
