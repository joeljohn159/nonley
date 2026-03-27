export default function DiscoverPage() {
  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h2 className="mb-8 text-[18px] font-medium text-neutral-900">
          Discover
        </h2>
        <div className="mb-8">
          <input
            type="search"
            placeholder="Search circles, topics, people..."
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-[13.5px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
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
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <h3 className="mb-3 text-[12px] font-medium uppercase tracking-wider text-neutral-400">
        {title}
      </h3>
      <p className="text-[13px] text-neutral-400">Coming soon</p>
    </div>
  );
}
