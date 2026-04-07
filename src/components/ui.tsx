import { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/14 blur-3xl" />
        <div className="absolute right-[-4rem] top-64 h-56 w-56 rounded-full bg-cyan-400/8 blur-3xl" />
        <div className="absolute bottom-24 left-[-4rem] h-56 w-56 rounded-full bg-blue-700/10 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-28 pt-5 md:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted/90">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(19,35,58,0.96),rgba(10,18,32,0.96))] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.34)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="h-full">
      <p className="text-[11px] uppercase tracking-[0.22em] text-blue-100/50">{label}</p>
      <p className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.04em] text-white">{value}</p>
      {hint ? <p className="mt-2 text-sm text-muted/90">{hint}</p> : null}
    </Card>
  );
}

export function PillButton({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const variants = {
    primary:
      "bg-[linear-gradient(180deg,#4b93ff,#2563eb)] text-white shadow-glow hover:brightness-110 disabled:bg-accent/40",
    ghost:
      "border border-white/8 bg-white/5 text-foreground hover:bg-white/10 disabled:bg-panelStrong/40",
    danger:
      "border border-red-400/10 bg-red-500/15 text-red-100 hover:bg-red-500/25 disabled:bg-red-500/10",
  };

  return (
    <button
      className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${variants[variant]}`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-muted">
      <span className="text-[11px] uppercase tracking-[0.18em] text-blue-100/45">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-base text-foreground placeholder:text-muted/70 shadow-inner shadow-black/10 ${className ?? ""}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`min-h-24 w-full rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-base text-foreground placeholder:text-muted/70 shadow-inner shadow-black/10 ${className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`w-full appearance-none rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 text-base text-foreground shadow-inner shadow-black/10 ${className ?? ""}`}
    >
      {children}
    </select>
  );
}

export function Toggle({
  checked,
  onClick,
  label,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      className={`flex w-full items-center justify-between rounded-[22px] border px-4 py-3 text-left transition ${
        checked
          ? "border-blue-400/30 bg-[linear-gradient(180deg,rgba(37,99,235,0.28),rgba(19,35,58,0.95))] text-foreground shadow-[0_0_0_1px_rgba(96,165,250,0.06)]"
          : "border-white/8 bg-white/[0.04] text-muted"
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="pr-3 text-sm font-medium">{label}</span>
      <span
        className={`flex h-6 w-11 items-center rounded-full p-1 transition ${
          checked ? "bg-accent" : "bg-border"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { label: string; value: T }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-[28px] border border-white/8 bg-white/[0.04] p-1.5 backdrop-blur">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-[linear-gradient(180deg,#4b93ff,#2563eb)] text-white shadow-glow"
                : "text-muted hover:bg-white/[0.04] hover:text-foreground"
            }`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className="h-3 w-full overflow-hidden rounded-full border border-white/8 bg-white/[0.05]">
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#60a5fa,#2563eb)] shadow-[0_0_18px_rgba(96,165,250,0.35)] transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        aria-label="Close sheet"
        className="absolute inset-0 bg-[rgba(2,6,14,0.78)] backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-md rounded-t-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,38,66,0.98),rgba(8,14,26,0.98))] px-4 pb-5 pt-3 shadow-[0_-24px_64px_rgba(0,0,0,0.45)]">
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-white/12" />
        <div className="mb-4">
          <p className="text-lg font-semibold tracking-[-0.03em] text-white">{title}</p>
          {subtitle ? <p className="mt-1 text-sm text-muted/85">{subtitle}</p> : null}
        </div>
        <div className={`${footer ? "max-h-[56vh]" : "max-h-[72vh]"} overflow-y-auto pr-1`}>{children}</div>
        {footer ? (
          <div className="-mx-4 mt-4 border-t border-white/8 bg-[linear-gradient(180deg,rgba(16,28,48,0.98),rgba(8,14,26,0.99))] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.9rem)] pt-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
