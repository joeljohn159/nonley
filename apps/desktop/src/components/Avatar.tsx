/**
 * Reusable avatar component with online indicator and fallback initials.
 */

interface AvatarProps {
  name: string | null;
  avatarUrl: string | null;
  size?: "sm" | "md" | "lg";
  online?: boolean;
  showIndicator?: boolean;
}

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

const indicatorSizes = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
} as const;

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || "?";
}

function Avatar({
  name,
  avatarUrl,
  size = "md",
  online,
  showIndicator = false,
}: AvatarProps) {
  const initials = getInitials(name);

  return (
    <div className="relative inline-flex flex-shrink-0">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name ?? "User avatar"}
          className={`${sizeClasses[size]} ring-nonley-border rounded-full object-cover ring-1`}
          loading="lazy"
        />
      ) : (
        <div
          className={`${sizeClasses[size]} bg-nonley-primary ring-nonley-border flex items-center justify-center rounded-full font-medium text-white ring-1`}
        >
          {initials}
        </div>
      )}
      {showIndicator && online !== undefined && (
        <span
          className={`${indicatorSizes[size]} ring-nonley-surface absolute bottom-0 right-0 rounded-full ring-2 ${
            online ? "bg-nonley-accent" : "bg-nonley-muted"
          }`}
        />
      )}
    </div>
  );
}

export default Avatar;
