import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { brandsQuery, catalogApi, categoriesQuery, settingsQuery } from "@/lib/api/catalog";
import type { SortKey } from "@/lib/api/types";
import { ProductCard } from "@/components/store/ProductCard";
import { HeroSlider } from "@/components/store/HeroSlider";

const searchSchema = z.object({
  q: z.string().optional(),
  cat: z.string().optional(),
  brand: z.string().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "popular"]).optional(),
  page: z.coerce.number().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: searchSchema,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(settingsQuery),
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(brandsQuery),
    ]),
  head: () => ({
    meta: [
      { title: "تِك ستور | جوالات وإكسسوارات إلكترونية أصلية" },
      { name: "description", content: "تسوّق الجوالات والسماعات والساعات الذكية والشواحن بأسعار بالشيكل وتوصيل لجميع المناطق." },
      { property: "og:title", content: "تِك ستور | جوالات وإكسسوارات إلكترونية" },
      { property: "og:description", content: "إلكترونيات أصلية بضمان، دفع عند الاستلام وتوصيل سريع." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Catalog,
});

const sorts: { k: SortKey; l: string }[] = [
  { k: "newest", l: "الأحدث" },
  { k: "price_asc", l: "الأقل سعراً" },
  { k: "price_desc", l: "الأعلى سعراً" },
  { k: "popular", l: "الأكثر طلباً" },
];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-lg border px-3.5 py-1.5 text-sm transition-colors ${
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}

function Catalog() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/" });
  const set = (patch: Partial<typeof s>) =>
    navigate({ search: (prev) => ({ ...prev, page: undefined, ...patch }), replace: true });

  const { data: settings } = useQuery(settingsQuery);
  const { data: cats = [] } = useQuery(categoriesQuery);
  const { data: brands = [] } = useQuery(brandsQuery);

  // debounced search input
  const [term, setTerm] = useState(s.q ?? "");
  useEffect(() => setTerm(s.q ?? ""), [s.q]);
  useEffect(() => {
    const t = setTimeout(() => { if ((s.q ?? "") !== term) set({ q: term || undefined }); }, 350);
    return () => clearTimeout(t);
  }, [term]); // eslint-disable-line react-hooks/exhaustive-deps

  const [minIn, setMinIn] = useState(s.min?.toString() ?? "");
  const [maxIn, setMaxIn] = useState(s.max?.toString() ?? "");

  const query = { search: s.q, categoryId: s.cat, brandId: s.brand, minPrice: s.min, maxPrice: s.max, sort: s.sort, page: s.page ?? 1 };
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["products", query],
    queryFn: () => catalogApi.products(query),
    placeholderData: keepPreviousData,
  });

  const shownBrands = brands.filter((b) => data?.availableBrandIds.includes(b.id) || b.id === s.brand);
  const active = [
    s.q && { l: `بحث: ${s.q}`, clear: () => set({ q: undefined }) },
    s.cat && { l: cats.find((c) => c.id === s.cat)?.name, clear: () => set({ cat: undefined }) },
    s.brand && { l: brands.find((b) => b.id === s.brand)?.name, clear: () => set({ brand: undefined }) },
    (s.min != null || s.max != null) && { l: `السعر: ${s.min ?? 0} - ${s.max ?? "∞"} ₪`, clear: () => { setMinIn(""); setMaxIn(""); set({ min: undefined, max: undefined }); } },
  ].filter(Boolean) as { l: string; clear: () => void }[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-5">
      <div className="relative md:hidden">
        <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input aria-label="البحث عن المنتجات" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="ابحث عن منتج..." className="h-11 w-full rounded-lg border border-input bg-card pr-9 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </div>

      {!s.q && !s.cat && !s.brand && <HeroSlider />}

      {settings?.banner.enabled && (
        <div className="mt-4 rounded-xl border bg-accent px-4 py-3 text-sm font-medium text-accent-foreground md:mt-0">
          {settings.banner.text}
        </div>
      )}

      <div className="mt-6 flex items-end justify-between gap-3">
        <h1 className="min-w-0 text-2xl font-bold">تِك ستور — جوالات وإكسسوارات إلكترونية أصلية</h1>
        {data && <span className="text-sm text-muted-foreground">{data.total} منتج</span>}
      </div>

      <div className="mt-4 space-y-3">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none md:flex-wrap">
          <Chip active={!s.cat} onClick={() => set({ cat: undefined, brand: undefined })}>الكل</Chip>
          {cats.map((c) => (
            <Chip key={c.id} active={s.cat === c.id} onClick={() => set({ cat: c.id, brand: undefined })}>{c.name}</Chip>
          ))}
        </div>
        {shownBrands.length > 0 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none md:flex-wrap">
            <Chip active={!s.brand} onClick={() => set({ brand: undefined })}>كل الماركات</Chip>
            {shownBrands.map((b) => (
              <Chip key={b.id} active={s.brand === b.id} onClick={() => set({ brand: b.id })}>{b.name}</Chip>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <form
            className="flex items-center gap-1.5"
            onSubmit={(e) => { e.preventDefault(); set({ min: minIn ? Number(minIn) : undefined, max: maxIn ? Number(maxIn) : undefined }); }}
          >
            <span className="text-muted-foreground">السعر</span>
            <input aria-label="الحد الأدنى للسعر بالشيكل" inputMode="numeric" value={minIn} onChange={(e) => setMinIn(e.target.value.replace(/\D/g, ""))} placeholder="من" className="h-9 w-20 rounded-lg border border-input bg-card px-2" />
            <input aria-label="الحد الأعلى للسعر بالشيكل" inputMode="numeric" value={maxIn} onChange={(e) => setMaxIn(e.target.value.replace(/\D/g, ""))} placeholder="إلى" className="h-9 w-20 rounded-lg border border-input bg-card px-2" />
            <button className="h-9 rounded-lg border bg-card px-3 hover:bg-secondary">تطبيق</button>
          </form>
          <select
            value={s.sort ?? "newest"}
            onChange={(e) => set({ sort: e.target.value as SortKey })}
            className="h-9 rounded-lg border border-input bg-card px-2 ms-auto"
            aria-label="ترتيب حسب"
          >
            {sorts.map((x) => <option key={x.k} value={x.k}>{x.l}</option>)}
          </select>
        </div>
        {active.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {active.map((a) => (
              <button key={a.l} onClick={a.clear} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs">
                {a.l} <X className="size-3" />
              </button>
            ))}
            <button onClick={() => { setTerm(""); setMinIn(""); setMaxIn(""); navigate({ search: {}, replace: true }); }} className="text-xs text-primary hover:underline">
              مسح جميع الفلاتر
            </button>
          </div>
        )}
      </div>

      <div className={`mt-6 transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`}>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-secondary" />)}
          </div>
        ) : isError ? (
          <div className="rounded-xl border bg-card p-10 text-center">
            <p>تعذّر تحميل المنتجات.</p>
            <button onClick={() => refetch()} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground">إعادة المحاولة</button>
          </div>
        ) : data && data.items.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground">
            لا توجد منتجات مطابقة لبحثك. جرّب كلمات أخرى أو امسح الفلاتر.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {data?.items.map((p) => <ProductCard key={p.id} product={p} brands={brands} />)}
            </div>
            {data && data.items.length < data.total && (
              <div className="mt-8 text-center">
                <button onClick={() => navigate({ search: (prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }), replace: true, resetScroll: false })} className="rounded-lg border bg-card px-6 py-2.5 text-sm hover:bg-secondary">
                  عرض المزيد
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
