import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Minus, Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { brandsQuery, catalogApi, categoriesQuery, productQuery, settingsQuery } from "@/lib/api/catalog";
import { useCart } from "@/lib/cart";
import { PriceTag, ProductCard } from "@/components/store/ProductCard";
import { CompatibleAccessories } from "@/components/store/CompatibleAccessories";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(settingsQuery);
    const p = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!p) throw notFound();
    return { name: p.name, description: p.description };
  },
  head: ({ loaderData }) =>
    loaderData
      ? {
          meta: [
            { title: `${loaderData.name} | تِك ستور` },
            { name: "description", content: loaderData.description },
            { property: "og:title", content: loaderData.name },
            { property: "og:description", content: loaderData.description },
            { property: "og:type", content: "website" },
            { name: "twitter:card", content: "summary_large_image" },
          ],
        }
      : { meta: [{ title: "المنتج غير متوفر" }, { name: "robots", content: "noindex" }] },
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-lg font-semibold">هذا المنتج غير موجود</p>
      <Link to="/" className="mt-4 inline-block text-primary hover:underline">العودة إلى المنتجات</Link>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(productQuery(slug));
  const { data: brands } = useQuery(brandsQuery);
  const { data: related = [] } = useQuery({ queryKey: ["related", slug], queryFn: () => catalogApi.related(p!), enabled: !!p });
  const { data: accessories = [] } = useQuery({ queryKey: ["compatible", slug], queryFn: () => catalogApi.compatibleAccessories(p!), enabled: !!p });
  const { data: categories } = useQuery(categoriesQuery);
  const { add } = useCart();
  const [img, setImg] = useState(0);
  const [variantId, setVariantId] = useState<string | undefined>();
  const [qty, setQty] = useState(1);
  if (!p) return null;

  const variant = p.variants.find((v) => v.id === variantId);
  const needsVariant = p.variants.length > 0;
  const price = variant?.price ?? p.price;
  const discount = variant ? variant.discountPrice : p.discountPrice;
  const stock = variant?.stock ?? (needsVariant ? p.variants.reduce((s, v) => s + v.stock, 0) : p.stock);
  const canAdd = stock > 0 && (!needsVariant || (variant && variant.stock > 0));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="mb-4 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">جميع المنتجات</Link> / <span className="text-foreground">{p.name}</span>
      </nav>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-xl border bg-secondary">
            <img src={p.images[img]} alt={p.name} width={816} height={816} className="size-full object-cover" />
          </div>
          {p.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {p.images.map((src, i) => (
                <Button variant="ghost" key={i} aria-label={`عرض الصورة ${i + 1} للمنتج ${p.name}`} aria-pressed={i === img} onClick={() => setImg(i)} className={`size-16 overflow-hidden rounded-lg border-2 p-0 ${i === img ? "border-primary" : "border-transparent"}`}>
                  <img src={src} alt="" className="size-full object-cover" />
                </Button>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{brands?.find((b) => b.id === p.brandId)?.name}</p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">{p.name}</h1>
          {p.model && <p className="mt-1 text-sm text-muted-foreground">الموديل: {p.model}</p>}
          <div className="mt-4"><PriceTag price={price} discountPrice={discount} large /></div>
          <p className={`mt-2 text-sm ${stock > 0 ? "text-success" : "text-destructive"}`}>
            {stock > 0 ? (stock <= 3 ? `متبقٍ ${stock} قطع فقط` : "متوفر في المخزون") : "غير متوفر حالياً"}
          </p>

          {needsVariant && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">اختر النوع</p>
              <div className="flex flex-wrap gap-2">
                {p.variants.map((v) => (
                  <button
                    key={v.id}
                    disabled={v.stock === 0}
                    onClick={() => { setVariantId(v.id); setQty(1); }}
                    className={`rounded-lg border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${variantId === v.id ? "border-primary bg-accent text-accent-foreground" : "bg-card"}`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-lg border bg-card">
              <button aria-label="زيادة الكمية" onClick={() => setQty((q) => Math.min(stock, q + 1))} className="p-2.5"><Plus className="size-4" /></button>
              <span className="w-8 text-center">{qty}</span>
              <button aria-label="إنقاص الكمية" onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2.5"><Minus className="size-4" /></button>
            </div>
            <button
              disabled={!canAdd}
              onClick={() => {
                add({ productId: p.id, variantId: variant?.id, slug: p.slug, name: p.name, variantLabel: variant?.label, image: p.images[0] ?? "", unitPrice: discount ?? price, maxStock: variant?.stock ?? p.stock }, qty);
                toast.success("تمت الإضافة إلى السلة");
              }}
              className="h-11 flex-1 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {needsVariant && !variant ? "اختر النوع أولاً" : "أضف إلى السلة"}
            </button>
          </div>

          {p.warranty && (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-4 text-primary" /> {p.warranty}</p>
          )}

          <div className="mt-8">
            <h2 className="font-semibold">الوصف</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{p.description}</p>
          </div>
          {p.specs.length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold">المواصفات</h2>
              <dl className="mt-2 divide-y rounded-lg border bg-card text-sm">
                {p.specs.map((s) => (
                  <div key={s.label} className="flex justify-between gap-4 px-4 py-2.5">
                    <dt className="text-muted-foreground">{s.label}</dt><dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      <CompatibleAccessories device={p} items={accessories} categories={categories} />

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-xl font-bold">منتجات مشابهة</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((r) => <ProductCard key={r.id} product={r} brands={brands} />)}
          </div>
        </section>
      )}
    </div>
  );
}
