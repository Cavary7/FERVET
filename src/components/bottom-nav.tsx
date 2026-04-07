"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home" },
  { href: "/calendar", label: "Calendar" },
  { href: "/goals", label: "Goals" },
  { href: "/progress", label: "Progress" },
  { href: "/tasks", label: "Tasks" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-3xl border border-border bg-panel/95 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur">
      <ul className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                className={`block rounded-2xl px-3 py-3 text-center text-sm font-medium transition ${
                  active
                    ? "bg-accent text-white shadow-glow"
                    : "text-muted hover:bg-panelStrong hover:text-foreground"
                }`}
                href={item.href}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
