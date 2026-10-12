import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { LayoutDashboard, Package, Tags, ShoppingCart, Settings, Images, Menu, X, LogOut, Store } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import { isBackendConnected } from "@/lib/api/client";
import { settingsQuery } from "@/lib/api/catalog";
import { Btn, Field, TextInput } from "@/components/admin/ui";
import { PageTransition } from "@/components/PageTransition";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم | تِك ستور" },
      { name: "description", content: "إدارة المنتجات والأقسام والطلبات وإعدادات المتجر." },
      { property: "og:title", content: "لوحة التحكم | تِك ستور" },
      { property: "og:description", content: "إدارة المتجر." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const TOKEN = "admin-token";
const nav = [
  { to: "/admin", l: "الرئيسية", i: LayoutDashboard, exact: true },
  { to: "/admin/products", l: "المنتجات", i: Package },
  { to: "/admin/categories", l: "الأقسام والماركات", i: Tags },
  { to: "/admin/slides", l: "شرائح البانر", i: Images },
  { to: "/admin/orders", l: "الطلبات", i: ShoppingCart },
  { to: "/admin/settings", l: "الإعدادات والمظهر", i: Settings },
] as const;

function AdminLayout() {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const { data: s } = useQuery(settingsQuery);
  useEffect(() => { setToken(sessionStorage.getItem(TOKEN)); setReady(true); }, []);

  const theme = s?.themeColor ? ({ "--primary": s.themeColor, "--ring": s.themeColor } as React.CSSProperties) : undefined;
  if (!ready) return <div className="min-h-screen" />;
  if (!token) return <div style={theme}><Login onDone={(t) => { sessionStorage.setItem(TOKEN, t); setToken(t); }} /></div>;

  const sidebar = (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          activeOptions={{ exact: "exact" in n }}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          activeProps={{ className: "!bg-accent !text-accent-foreground font-medium" }}
        >
          <n.i className="size-4" /> {n.l}
        </Link>
      ))}
      <div className="my-2 border-t" />
      <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary"><Store className="size-4" /> عرض المتجر</Link>
      <button onClick={() => { sessionStorage.removeItem(TOKEN); setToken(null); }} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-secondary">
        <LogOut className="size-4" /> تسجيل الخروج
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-background" style={theme}>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card px-4 lg:hidden">
        <button aria-label="القائمة" onClick={() => setOpen(true)}><Menu className="size-6" /></button>
        <span className="font-bold text-primary">لوحة التحكم</span>
      </header>
      <aside className="fixed inset-y-0 right-0 hidden w-60 border-l bg-card lg:block">
        <div className="border-b p-4 font-bold text-primary">{s?.storeName} · لوحة التحكم</div>
        {sidebar}
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-64 bg-card shadow-float">
            <div className="flex items-center justify-between border-b p-4">
              <span className="font-bold text-primary">لوحة التحكم</span>
              <button aria-label="إغلاق" onClick={() => setOpen(false)}><X className="size-5" /></button>
            </div>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="lg:mr-60">
        {!isBackendConnected && (
          <div className="bg-accent px-4 py-2 text-center text-xs text-accent-foreground">
            وضع تجريبي: لوحة التحكم غير متصلة بالخادم، والتعديلات تظهر في هذه الجلسة فقط وتُفقد عند تحديث الصفحة.
          </div>
        )}
        <main className="mx-auto max-w-6xl p-4 md:p-6"><PageTransition><Outlet /></PageTransition></main>
      </div>
    </div>
  );
}

function Login({ onDone }: { onDone: (t: string) => void }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (isBackendConnected && (!email || !pw)) return setErr("يرجى إدخال البريد الإلكتروني وكلمة المرور");
    setBusy(true); setErr(null);
    try { onDone((await adminApi.login(email, pw)).token); }
    catch (x) { setErr(x instanceof Error ? x.message : "بيانات الدخول غير صحيحة"); }
    finally { setBusy(false); }
  };
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-6 shadow-card">
        <h1 className="text-xl font-bold">تسجيل دخول المدير</h1>
        <Field label="البريد الإلكتروني"><TextInput type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="كلمة المرور"><TextInput type="password" dir="ltr" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        {err && <p className="text-sm text-destructive">{err}</p>}
        {!isBackendConnected && <p className="rounded-lg bg-secondary p-2.5 text-xs text-muted-foreground">الخادم غير متصل بعد، لذلك يتم الدخول في وضع تجريبي دون التحقق من البيانات.</p>}
        <Btn className="w-full" disabled={busy}>{busy ? "جارٍ الدخول..." : isBackendConnected ? "دخول" : "دخول تجريبي"}</Btn>
      </form>
    </div>
  );
}
