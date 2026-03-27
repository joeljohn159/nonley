export default function ProfilePage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-[16px] font-medium text-neutral-400">
              ?
            </div>
            <div>
              <h2 className="text-[16px] font-medium text-neutral-900">
                User Profile
              </h2>
              <p className="font-mono text-[12px] text-neutral-400">
                {params.id}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <ProfileSection
              title="Currently Browsing"
              content="Opt-in feature"
            />
            <ProfileSection
              title="Interests"
              content="Auto-generated + manual tags"
            />
            <ProfileSection
              title="Circles"
              content="Shared circles appear here"
            />
            <ProfileSection
              title="Web Trail"
              content="Public breadcrumb of recent reads"
            />
          </div>
          <div className="mt-6">
            <button className="rounded-lg bg-neutral-900 px-5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800">
              Wave
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function ProfileSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div>
      <h3 className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
        {title}
      </h3>
      <p className="mt-1 text-[13px] text-neutral-500">{content}</p>
    </div>
  );
}
