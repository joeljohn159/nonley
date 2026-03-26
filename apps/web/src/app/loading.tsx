export default function Loading() {
  return (
    <div className="bg-nonley-bg flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="border-nonley-border border-t-nonley-accent h-8 w-8 animate-spin rounded-full border-2" />
        <p className="text-nonley-text-muted text-sm">Loading...</p>
      </div>
    </div>
  );
}
