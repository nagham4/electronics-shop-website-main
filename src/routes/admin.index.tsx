import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminApi, orderStatusLabels } from "@/lib/api/admin";
import { formatPrice } from "@/lib/cart";
import { PageHeader, Panel } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [
    { title: "نظرة عامة — لوحة التحكم | تِك ستور" },
    { name: "description", content: "ملخص المبيعات والطلبات والمخزون في تِك ستور." },
    { property: "og:title", content: "نظرة عامة — لوحة التحكم | تِك ستور" },
    { property: "og:description", content: "ملخص المبيعات والطلبات والمخزون في تِك ستور." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: products = [] } = useQuery({ queryKey: ["admin", "products"], queryFn: adminApi.products });
  const { data: cats = [] } = useQuery({ queryKey: ["admin", "categories"], queryFn: adminApi.categories });
  const { data: orders = [] } = useQuery({ queryKey: ["admin", "orders"], queryFn: adminApi.orders });

  const low = products.filter((p) => p.stock <= 3);
  const active = orders.filter((o) => o.status !== "cancelled");
  const revenue = active.reduce((s, o) => s + o.total, 0);
  const stats = [
    { l: "إجمالي المبيعات", v: formatPrice(revenue) },
    { l: "الطلبات الجديدة", v: orders.filter((o) => o.status === "new").length },
    { l: "المنتجات", v: products.length },
    { l: "قاربت على النفاد", v: low.length },
  ];

  // Sales of the last 7 days (cancelled orders excluded).
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const perDay = days.map((d) => {
    const next = d.getTime() + 86400e3;
    return active.filter((o) => { const t = new Date(o.createdAt).getTime(); return t >= d.getTime() && t < next; })
      .reduce((s, o) => s + o.total, 0);
  });
  const max = Math.max(...perDay, 1);

  return (
    <>
      <PageHeader title="نظرة عامة" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="rounded-xl border bg-card p-4 shadow-card">
            <p className="text-sm text-muted-foreground">{s.l}</p>
            <p className="mt-1 text-2xl font-bold">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="مبيعات آخر 7 أيام">
          <div className="flex h-40 items-end gap-2">
            {perDay.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{v > 0 ? formatPrice(v) : ""}</span>
                <div className="w-full rounded-t bg-primary/80" style={{ height: `${Math.max((v / max) * 100, v > 0 ? 6 : 2)}%` }} />
                <span className="text-[10px] text-muted-foreground">{days[i]!.toLocaleDateString("ar-PS", { weekday: "short" })}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="أحدث الطلبات">
          {orders.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد طلبات بعد.</p> : (
            <ul className="divide-y text-sm">
              {orders.slice(0, 5).map((o) => (
                <li key={o.orderNumber} className="flex items-center justify-between gap-2 py-2">
                  <div>
                    <span className="font-medium">{o.customerName}</span>
                    <span className="mr-2 text-xs text-muted-foreground" dir="ltr">{o.orderNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{formatPrice(o.total)}</span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{orderStatusLabels[o.status]}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/orders" className="mt-3 inline-block text-sm text-primary hover:underline">كل الطلبات</Link>
        </Panel>

        <Panel title="تنبيهات المخزون">
          {low.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد منتجات منخفضة المخزون.</p> : (
            <ul className="divide-y text-sm">
              {low.map((p) => (
                <li key={p.id} className="flex justify-between py-2">
                  <span>{p.name}</span>
                  <span className={p.stock === 0 ? "text-destructive" : "text-sale"}>{p.stock === 0 ? "نفد" : `متبقٍ ${p.stock}`}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/products" className="mt-3 inline-block text-sm text-primary hover:underline">إدارة المنتجات</Link>
        </Panel>

        <Panel title="الأقسام">
          <p className="text-sm text-muted-foreground">{cats.filter((c) => c.isActive).length} قسم فعّال من أصل {cats.length}.</p>
          <Link to="/admin/categories" className="mt-3 inline-block text-sm text-primary hover:underline">إدارة الأقسام والماركات</Link>
        </Panel>
      </div>
    </>
  );
}
