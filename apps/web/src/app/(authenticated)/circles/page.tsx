export default function CirclesPage() {
  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-[18px] font-medium text-neutral-900">
            Your Circles
          </h2>
          <button className="rounded-lg bg-neutral-900 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800">
            Create Circle
          </button>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white py-20 text-center">
          <p className="text-[15px] text-neutral-500">No circles yet.</p>
          <p className="mt-2 text-[13px] text-neutral-400">
            Circles form around shared browsing patterns, interests, or you can
            create them manually.
          </p>
        </div>
      </div>
    </main>
  );
}
