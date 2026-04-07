"use client";

import { useEffect, useMemo, useState } from "react";
import { BRANDING } from "@/lib/branding";
import { todayKey } from "@/lib/date";
import { getMottoForDate } from "@/lib/metrics";
import { useAppStore } from "@/lib/store";

export function LaunchSplash() {
  const { state, hydrated } = useAppStore();
  const [mounted, setMounted] = useState(true);
  const [visible, setVisible] = useState(true);
  const [latinText, setLatinText] = useState("");
  const [englishText, setEnglishText] = useState("");
  const [showEnglish, setShowEnglish] = useState(false);
  const motto = useMemo(() => {
    if (!hydrated) return null;
    return getMottoForDate(state, todayKey());
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated || !motto) {
      return;
    }

    if (window.sessionStorage.getItem("fervet:splash-seen") === "1") {
      setMounted(false);
      return;
    }
    window.sessionStorage.setItem("fervet:splash-seen", "1");

    const chars = Array.from(motto.latin);
    const step = Math.max(32, Math.min(58, Math.floor(1400 / Math.max(chars.length, 1))));
    setLatinText("");
    setEnglishText(motto.english);
    setShowEnglish(false);

    const interval = window.setInterval(() => {
      setLatinText((current) => {
        const nextIndex = current.length;
        const next = chars.slice(0, nextIndex + 1).join("");
        if (next.length === motto.latin.length) {
          window.clearInterval(interval);
          window.setTimeout(() => setShowEnglish(true), 180);
          window.setTimeout(() => setVisible(false), 900);
          window.setTimeout(() => setMounted(false), 1550);
        }
        return next;
      });
    }, step);

    return () => {
      window.clearInterval(interval);
    };
  }, [hydrated, motto]);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[70] transition duration-700 ${
        visible ? "opacity-100" : "opacity-0"
      } ${visible ? "" : "hidden"}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_24%),linear-gradient(180deg,#07111f_0%,#040811_100%)]" />
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-24 h-56 w-56 -translate-x-1/2 rounded-full bg-blue-500/14 blur-3xl" />
        <div className="absolute bottom-20 right-[-2rem] h-44 w-44 rounded-full bg-cyan-400/8 blur-3xl" />
      </div>
      <div className="relative flex min-h-screen items-center justify-center px-8 text-center">
        <div className="max-w-sm">
          <p className="text-[11px] uppercase tracking-[0.34em] text-blue-200/62">
            {BRANDING.appName}
          </p>
          <p className="mt-5 text-[2rem] font-semibold leading-[1.05] tracking-[-0.05em] text-white">
            {latinText || "\u00A0"}
          </p>
          <p
            className={`mt-4 min-h-14 text-base leading-7 text-blue-50/74 transition duration-500 ${
              showEnglish ? "opacity-100" : "opacity-0"
            }`}
          >
            {englishText || "\u00A0"}
          </p>
        </div>
      </div>
    </div>
  );
}
