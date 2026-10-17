"use client";

import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";

export function NavLinks({
  items,
  label,
}: {
  items: { href: string; label: string; quiet?: boolean }[];
  label: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto" aria-label={label}>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
              active
                ? "bg-primary/15 text-primary"
                : item.quiet
                  ? "text-muted-foreground/80 hover:text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
