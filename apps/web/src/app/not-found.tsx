import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa]">
      <h1 className="mb-2 text-[48px] font-medium text-neutral-300">404</h1>
      <p className="mb-6 text-[14px] text-neutral-500">
        This page doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-neutral-900 px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800"
      >
        Go Home
      </Link>
    </main>
  );
}
