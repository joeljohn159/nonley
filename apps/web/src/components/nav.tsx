"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const NAV_ITEMS = [
  { href: "/", label: "Map" },
  { href: "/circles", label: "Circles" },
  { href: "/discover", label: "Discover" },
  { href: "/settings", label: "Settings" },
];

export function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <nav className="border-nonley-border bg-nonley-surface/50 border-b px-6 py-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="text-nonley-accent text-xl font-bold">
          nonley
        </Link>
        <div className="flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm transition-colors ${
                pathname === item.href
                  ? "text-nonley-text font-medium"
                  : "text-nonley-text-muted hover:text-nonley-text"
              }`}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
          {session.user.isAdmin && (
            <Link
              href="/admin"
              className={`text-sm transition-colors ${
                pathname === "/admin"
                  ? "text-nonley-warning font-medium"
                  : "text-nonley-warning/60 hover:text-nonley-warning"
              }`}
            >
              Admin
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-nonley-text-muted text-sm">
            {session.user?.name}
          </span>
          {session.user?.image && (
            <Image
              src={session.user.image}
              alt={session.user.name ?? "Avatar"}
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <button
            onClick={() => signOut()}
            className="text-nonley-text-muted hover:text-nonley-error text-xs transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
