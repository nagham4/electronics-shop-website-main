import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

export function PageHeader({ title, desc, action }: { title: string; desc?: string | undefined; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4 shadow-card md:p-5">
      {title && <h2 className="mb-4 font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

export function Field({ label, error, children, wide }: { label: string; error?: string | undefined; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`block text-sm ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block font-medium">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

const base = "w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";
export const TextInput = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`h-10 ${base} ${p.className ?? ""}`} />;
export const TextArea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={3} {...p} className={`py-2 ${base}`} />;
export const SelectInput = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={`h-10 ${base}`} />;

export function Btn({ variant = "primary", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "danger" | "ghost" }) {
  const v = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    outline: "border bg-card hover:bg-secondary",
    danger: "bg-destructive text-destructive-foreground hover:opacity-90",
    ghost: "hover:bg-secondary",
  }[variant];
  return <button {...p} className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-medium transition disabled:opacity-50 ${v} ${p.className ?? ""}`} />;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-3 text-sm" aria-pressed={checked}>
      <span className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-primary" : "bg-input"}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-card shadow transition-all ${checked ? "right-0.5" : "right-[1.375rem]"}`} />
      </span>
      {label}
    </button>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">{children}</div>;
}
