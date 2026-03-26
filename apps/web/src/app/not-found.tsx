import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bg-nonley-bg flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-nonley-accent mb-2 text-6xl font-bold">404</h1>
      <p className="text-nonley-text-muted mb-6">This page doesn't exist.</p>
      <Link
        href="/"
        className="bg-nonley-accent hover:bg-nonley-accent-hover rounded-lg px-6 py-3 text-sm font-medium text-white transition-colors"
      >
        Go Home
      </Link>
    </main>
  );
}
