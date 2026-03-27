"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/", label: "Map" },
  { href: "/chat", label: "Chat" },
  { href: "/friends", label: "Friends" },
  { href: "/circles", label: "Circles" },
  { href: "/discover", label: "Discover" },
  { href: "/settings", label: "Settings" },
];

export function Nav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === "unauthenticated" || !session) {
    if (status === "loading") {
      return (
        <nav className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex h-14 max-w-5xl items-center px-6">
            <img src="/logo-icon.png" alt="Nonley" className="h-6 w-auto" />
          </div>
        </nav>
      );
    }
    return null;
  }

  return (
    <nav className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <img src="/logo-text.png" alt="Nonley" className="h-6 w-auto" />
          </Link>
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                  pathname === item.href
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
            {session.user.isAdmin && (
              <Link
                href="/admin"
                className={`rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                  pathname === "/admin"
                    ? "bg-amber-50 text-amber-700"
                    : "text-amber-600/60 hover:text-amber-700"
                }`}
              >
                Admin
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-neutral-500">
            {session.user?.name}
          </span>
          {session.user?.image && (
            <Image
              src={session.user.image}
              alt={session.user.name ?? "Avatar"}
              width={28}
              height={28}
              className="rounded-full"
            />
          )}
          <button
            onClick={() => signOut()}
            className="text-[12px] text-neutral-400 transition-colors hover:text-neutral-600"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
