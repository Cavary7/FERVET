"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Home" },
  { href: "/track", label: "Track" },
  { href: "/calendar", label: "Calendar" },
  { href: "/goals", label: "Goals" },
  { href: "/progress", label: "Progress" },
  { href: "/tasks", label: "Tasks" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.45rem)]">
      <nav className="pointer-events-auto w-full max-w-md rounded-3xl border border-border bg-panel/95 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur">
        <ul className="flex items-stretch justify-between gap-1">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <li className="min-w-0 flex-1" key={item.href}>
                <Link
                  className={`flex min-h-[50px] items-center justify-center rounded-2xl px-1 text-center text-[12px] font-medium leading-none transition ${
                    active
                      ? "bg-accent text-white shadow-glow"
                      : "text-muted hover:bg-panelStrong hover:text-foreground"
                  }`}
                  href={item.href}
                >
                  <span className="block truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
