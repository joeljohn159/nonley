export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-600" />
        <p className="text-[13px] text-neutral-400">Loading...</p>
      </div>
    </div>
  );
}
