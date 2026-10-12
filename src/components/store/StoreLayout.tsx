import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, ShoppingBag, Search } from "lucide-react";
import { useState, type ReactNode, type FormEvent } from "react";
import { categoriesQuery, settingsQuery } from "@/lib/api/catalog";
import { useCart } from "@/lib/cart";
import { isBackendConnected } from "@/lib/api/client";
import { PageTransition } from "@/components/PageTransition";

export function StoreLayout({ children }: { children: ReactNode }) {
  const { data: s } = useQuery(settingsQuery);
  const theme = s?.themeColor ? ({ "--primary": s.themeColor, "--ring": s.themeColor } as React.CSSProperties) : undefined;
  return (
    <div className="flex min-h-screen flex-col" style={theme}>
      <Header />
      {!isBackendConnected && (
        <div className="bg-accent px-4 py-1.5 text-center text-xs text-accent-foreground">
          نسخة تجريبية: المنتجات المعروضة نماذج، واستقبال الطلبات غير مفعّل بعد.
        </div>
      )}
      <main className="flex-1"><PageTransition>{children}</PageTransition></main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

function Header() {
  const { data: s } = useQuery(settingsQuery);
  const { data: cats } = useQuery(categoriesQuery);
  const { count } = useCart();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/", search: { q: q || undefined } });
  };
  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link to="/" search={{}} className="shrink-0 text-xl font-bold text-primary">
          {s?.storeName ?? "المتجر"}
        </Link>
        <form onSubmit={submit} className="relative hidden flex-1 md:block">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            aria-label="البحث باسم المنتج أو الماركة أو الموديل"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث باسم المنتج أو الماركة أو الموديل"
            className="h-10 w-full rounded-lg border border-input bg-background pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </form>
        <div className="flex-1 md:hidden" />
        <Link to="/cart" className="relative rounded-lg p-2 hover:bg-secondary" aria-label="سلة التسوق">
          <ShoppingBag className="size-6" />
          {count > 0 && (
            <span className="absolute -left-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
              {count}
            </span>
          )}
        </Link>
      </div>
      <nav className="mx-auto hidden max-w-7xl gap-5 overflow-x-auto px-4 pb-2 text-sm text-muted-foreground scrollbar-none md:flex">
        <Link to="/" search={{}} className="hover:text-foreground">الرئيسية</Link>
        {cats?.slice(0, 6).map((c) => (
          <Link key={c.id} to="/" search={{ cat: c.id }} className="whitespace-nowrap hover:text-foreground">{c.name}</Link>
        ))}
      </nav>
    </header>
  );
}

function Footer() {
  const { data: s } = useQuery(settingsQuery);
  if (!s) return null;
  const blocks = [
    { t: "الشحن والتوصيل", d: s.policies.shipping },
    { t: "الضمان", d: s.policies.warranty },
    { t: "الاستبدال والإرجاع", d: s.policies.returns },
    { t: "سياسة الخصوصية", d: s.policies.privacy },
  ];
  return (
    <footer className="mt-16 border-t bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold text-primary">{s.storeName}</p>
          <p className="mt-2 text-sm text-muted-foreground">{s.tagline}</p>
          <div className="mt-4 space-y-1 text-sm">
            <p dir="ltr" className="text-right">{s.phone}</p>
            <p>{s.email}</p>
            <p>{s.address}</p>
          </div>
          <div className="mt-3 flex gap-3 text-sm">
            {s.social.map((x) => <a key={x.label} href={x.url} className="text-primary hover:underline">{x.label}</a>)}
          </div>
        </div>
        {blocks.slice(0, 3).map((b) => (
          <div key={b.t}>
            <p className="font-semibold">{b.t}</p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{b.d}</p>
          </div>
        ))}
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        {blocks[3]?.d} · جميع الحقوق محفوظة © {s.storeName}
      </div>
    </footer>
  );
}

function WhatsAppButton() {
  const { data: s } = useQuery(settingsQuery);
  if (!s?.whatsapp.enabled || !s.whatsapp.phone) return null;
  const href = `https://wa.me/${s.whatsapp.phone.replace(/\D/g, "")}?text=${encodeURIComponent(s.whatsapp.message)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل معنا عبر واتساب"
      className="fixed bottom-5 left-5 z-50 grid size-14 place-items-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-float transition-transform hover:scale-105 active:scale-95"
    >
      <MessageCircle className="size-7" />
    </a>
  );
}
