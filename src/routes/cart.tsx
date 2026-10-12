import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { formatPrice, useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "سلة التسوق | تِك ستور" },
      { name: "description", content: "راجع المنتجات في سلتك قبل إتمام الطلب." },
      { property: "og:title", content: "سلة التسوق | تِك ستور" },
      { property: "og:description", content: "راجع المنتجات في سلتك قبل إتمام الطلب." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, setQty, remove } = useCart();
  if (items.length === 0)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-lg font-semibold">سلة التسوق — سلتك فارغة</h1>
        <p className="mt-1 text-sm text-muted-foreground">تصفّح المنتجات وأضف ما يعجبك.</p>
        <Link to="/" className="mt-5 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm text-primary-foreground">تسوّق الآن</Link>
      </div>
    );
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-5 text-2xl font-bold">سلة التسوق</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.key} className="flex gap-3 rounded-xl border bg-card p-3">
              <img src={i.image} alt={i.name} className="size-20 rounded-lg object-cover" />
              <div className="flex flex-1 flex-col">
                <Link to="/products/$slug" params={{ slug: i.slug }} className="font-medium hover:text-primary">{i.name}</Link>
                {i.variantLabel && <span className="text-xs text-muted-foreground">{i.variantLabel}</span>}
                <span className="mt-1 text-sm">{formatPrice(i.unitPrice)}</span>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-lg border">
                    <button aria-label="زيادة" onClick={() => setQty(i.key, i.quantity + 1)} className="p-1.5"><Plus className="size-4" /></button>
                    <span className="w-8 text-center text-sm">{i.quantity}</span>
                    <button aria-label="إنقاص" onClick={() => setQty(i.key, i.quantity - 1)} className="p-1.5"><Minus className="size-4" /></button>
                  </div>
                  <span className="font-semibold">{formatPrice(i.unitPrice * i.quantity)}</span>
                  <button aria-label="حذف" onClick={() => remove(i.key)} className="p-1.5 text-destructive"><Trash2 className="size-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <aside className="h-fit rounded-xl border bg-card p-4">
          <div className="flex justify-between text-sm"><span>المجموع الفرعي</span><span>{formatPrice(subtotal)}</span></div>
          <p className="mt-2 text-xs text-muted-foreground">تُحسب رسوم التوصيل في الخطوة التالية.</p>
          <Link to="/checkout" className="mt-4 block rounded-lg bg-primary py-2.5 text-center text-primary-foreground">إتمام الطلب</Link>
        </aside>
      </div>
    </div>
  );
}
