import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { adminApi, orderStatusLabels, type AdminOrder } from "@/lib/api/admin";
import { formatPrice } from "@/lib/cart";
import { EmptyState, PageHeader, SelectInput } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [
    { title: "إدارة الطلبات | تِك ستور" },
    { name: "description", content: "مراجعة طلبات تِك ستور وتحديث حالتها." },
    { property: "og:title", content: "إدارة الطلبات | تِك ستور" },
    { property: "og:description", content: "مراجعة طلبات تِك ستور وتحديث حالتها." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Orders,
});

const statusColor: Record<AdminOrder["status"], string> = {
  new: "bg-accent text-accent-foreground",
  confirmed: "bg-secondary text-foreground",
  shipped: "bg-secondary text-foreground",
  delivered: "bg-secondary text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

function Orders() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading, isError } = useQuery({ queryKey: ["admin", "orders"], queryFn: adminApi.orders });
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [filter, setFilter] = useState<AdminOrder["status"] | "all">("all");
  const m = useMutation({
    mutationFn: ({ n, s }: { n: string; s: AdminOrder["status"] }) => adminApi.setOrderStatus(n, s),
    onSuccess: (_d, v) => {
      toast.success("تم تحديث حالة الطلب");
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      setSelected((o) => (o && o.orderNumber === v.n ? { ...o, status: v.s } : o));
    },
    onError: (e) => toast.error(e.message),
  });

  const list = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  return (
    <>
      <PageHeader title="الطلبات" desc="متابعة الطلبات وتحديث حالتها. اضغط على أي طلب لعرض تفاصيله." />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", ...(Object.keys(orderStatusLabels) as AdminOrder["status"][])] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full border px-3 py-1.5 text-sm ${filter === k ? "border-primary bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"}`}
          >
            {k === "all" ? `الكل (${orders.length})` : `${orderStatusLabels[k]} (${orders.filter((o) => o.status === k).length})`}
          </button>
        ))}
      </div>
      {isLoading ? <div className="h-40 animate-pulse rounded-xl bg-secondary" /> : isError ? (
        <EmptyState>تعذّر تحميل الطلبات.</EmptyState>
      ) : list.length === 0 ? (
        <EmptyState>لا توجد طلبات {filter !== "all" ? "بهذه الحالة" : "بعد"}.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-right text-muted-foreground">
              <tr><th className="p-3">رقم الطلب</th><th className="p-3">العميل</th><th className="p-3">المدينة</th><th className="p-3">الإجمالي</th><th className="p-3">الحالة</th></tr>
            </thead>
            <tbody className="divide-y">
              {list.map((o) => (
                <tr key={o.orderNumber} onClick={() => setSelected(o)} className="cursor-pointer hover:bg-secondary/50">
                  <td className="p-3" dir="ltr">{o.orderNumber}</td>
                  <td className="p-3">{o.customerName}<div className="text-xs text-muted-foreground" dir="ltr">{o.phone}</div></td>
                  <td className="p-3">{o.city}</td>
                  <td className="p-3">{formatPrice(o.total)}</td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <SelectInput value={o.status} onChange={(e) => m.mutate({ n: o.orderNumber, s: e.target.value as AdminOrder["status"] })}>
                      {Object.entries(orderStatusLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </SelectInput>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selected && <OrderDrawer order={selected} onClose={() => setSelected(null)} onStatus={(s) => m.mutate({ n: selected.orderNumber, s })} />}
    </>
  );
}

function OrderDrawer({ order: o, onClose, onStatus }: { order: AdminOrder; onClose: () => void; onStatus: (s: AdminOrder["status"]) => void }) {
  const subtotal = o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  return (
    <div className="fixed inset-0 z-50 flex justify-start">
      <div className="absolute inset-0 bg-foreground/30" onClick={onClose} />
      <div className="relative mr-auto h-full w-full max-w-md overflow-y-auto bg-background shadow-float">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-5 py-3">
          <h2 className="font-semibold" dir="ltr">{o.orderNumber}</h2>
          <button aria-label="إغلاق" onClick={onClose}><X className="size-5" /></button>
        </div>
        <div className="space-y-6 p-5">
          <div className="flex items-center justify-between">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[o.status]}`}>{orderStatusLabels[o.status]}</span>
            <span className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString("ar-PS", { dateStyle: "medium", timeStyle: "short" })}</span>
          </div>

          <section>
            <h3 className="mb-2 text-sm font-medium">العميل</h3>
            <div className="space-y-1 rounded-lg border bg-card p-3 text-sm">
              <p className="font-medium">{o.customerName}</p>
              <p dir="ltr" className="text-muted-foreground">{o.phone}</p>
              <p className="text-muted-foreground">{o.city} · {o.area} · {o.address}</p>
              {o.notes && <p className="rounded bg-secondary p-2 text-xs">ملاحظة: {o.notes}</p>}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-medium">المنتجات</h3>
            <ul className="divide-y rounded-lg border bg-card text-sm">
              {o.items.map((i, k) => (
                <li key={k} className="flex items-center justify-between gap-2 p-3">
                  <div>
                    <p>{i.productName}</p>
                    {i.variantLabel && <p className="text-xs text-muted-foreground">{i.variantLabel}</p>}
                  </div>
                  <p className="whitespace-nowrap text-muted-foreground">{i.quantity} × {formatPrice(i.unitPrice)}</p>
                </li>
              ))}
              <li className="flex justify-between p-3 text-muted-foreground"><span>المجموع الفرعي</span><span>{formatPrice(subtotal)}</span></li>
              <li className="flex justify-between p-3 text-muted-foreground"><span>التوصيل</span><span>{o.shippingFee ? formatPrice(o.shippingFee) : "مجاني"}</span></li>
              <li className="flex justify-between p-3 font-bold"><span>الإجمالي</span><span>{formatPrice(o.total)}</span></li>
            </ul>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-medium">تحديث الحالة</h3>
            <SelectInput value={o.status} onChange={(e) => onStatus(e.target.value as AdminOrder["status"])}>
              {Object.entries(orderStatusLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </SelectInput>
          </section>
        </div>
      </div>
    </div>
  );
}
