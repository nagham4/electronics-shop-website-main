import { Link } from "@tanstack/react-router";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Category, Product } from "@/lib/api/types";
import { formatPrice, useCart } from "@/lib/cart";

export function CompatibleAccessories({ device, items, categories }: { device: Product; items: Product[]; categories?: Category[] | undefined }) {
  const { add } = useCart();
  const [added, setAdded] = useState<string[]>([]);
  if (items.length === 0) return null;

  return (
    <section className="mt-14 rounded-2xl border bg-card p-5">
      <div className="mb-4">
        <span className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">متوافقة مع {device.name}</span>
        <h2 className="mt-2 text-xl font-bold">إكسسوارات وملحقات مقترحة</h2>
        <p className="mt-1 text-sm text-muted-foreground">كفرات، حماية شاشة، شواحن وملحقات تناسب جهازك.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((a) => {
          const price = a.discountPrice ?? a.price;
          const isAdded = added.includes(a.id);
          const needsVariant = a.variants.length > 0;
          return (
            <div key={a.id} className="flex flex-col rounded-xl border bg-background p-3">
              <Link to="/products/$slug" params={{ slug: a.slug }} className="block">
                <div className="aspect-square overflow-hidden rounded-lg bg-secondary">
                  <img src={a.images[0]} alt={a.name} loading="lazy" width={816} height={816} className="size-full object-cover" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{categories?.find((c) => c.id === a.categoryId)?.name}</p>
                <p className="line-clamp-2 text-sm font-medium hover:text-primary">{a.name}</p>
              </Link>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-semibold">{formatPrice(price)}</span>
                {a.discountPrice != null && <span className="text-xs text-muted-foreground line-through">{formatPrice(a.price)}</span>}
              </div>
              {needsVariant ? (
                <Link to="/products/$slug" params={{ slug: a.slug }} className="mt-auto pt-3">
                  <span className="block rounded-lg border py-2 text-center text-sm">اختر النوع</span>
                </Link>
              ) : (
                <button
                  onClick={() => {
                    add({ productId: a.id, slug: a.slug, name: a.name, image: a.images[0] ?? "", unitPrice: price, maxStock: a.stock });
                    setAdded((s) => [...s, a.id]);
                    toast.success(`تمت إضافة ${a.name} إلى السلة`);
                  }}
                  className={`mt-auto flex items-center justify-center gap-1 rounded-lg py-2 text-sm ${isAdded ? "border border-primary text-primary" : "bg-primary text-primary-foreground hover:opacity-90"}`}
                  style={{ marginTop: "0.75rem" }}
                >
                  {isAdded ? <><Check className="size-4" /> أُضيف — أضف مرة أخرى</> : <><Plus className="size-4" /> أضف للسلة</>}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
