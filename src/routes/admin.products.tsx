import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { adminApi, readImage } from "@/lib/api/admin";
import type { Product } from "@/lib/api/types";
import { formatPrice } from "@/lib/cart";
import { Btn, EmptyState, Field, PageHeader, SelectInput, TextArea, TextInput } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [
    { title: "إدارة المنتجات | تِك ستور" },
    { name: "description", content: "إدارة منتجات تِك ستور وأسعارها وصورها ومخزونها." },
    { property: "og:title", content: "إدارة المنتجات | تِك ستور" },
    { property: "og:description", content: "إدارة منتجات تِك ستور وأسعارها وصورها ومخزونها." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ProductsPage,
});

const blank = (): Product => ({
  id: "", slug: "", name: "", brandId: "", categoryId: "", price: 0, stock: 0, images: [],
  description: "", specs: [], variants: [], popularity: 0, createdAt: "",
});

function ProductsPage() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery({ queryKey: ["admin", "products"], queryFn: adminApi.products });
  const { data: cats = [] } = useQuery({ queryKey: ["admin", "categories"], queryFn: adminApi.categories });
  const { data: brands = [] } = useQuery({ queryKey: ["admin", "brands"], queryFn: adminApi.brands });
  const [edit, setEdit] = useState<Product | null>(null);
  const [q, setQ] = useState("");
  const refresh = () => qc.invalidateQueries();

  const list = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader title="المنتجات" desc={`${products.length} منتج`} action={<Btn onClick={() => setEdit(blank())}><Plus className="size-4" /> منتج جديد</Btn>} />
      <TextInput placeholder="ابحث عن منتج..." value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 max-w-sm" />
      {isLoading ? <div className="h-40 animate-pulse rounded-xl bg-secondary" /> : list.length === 0 ? <EmptyState>لا توجد منتجات.</EmptyState> : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-right text-muted-foreground">
              <tr><th className="p-3">المنتج</th><th className="p-3">القسم</th><th className="p-3">السعر</th><th className="p-3">المخزون</th><th className="p-3" /></tr>
            </thead>
            <tbody className="divide-y">
              {list.map((p) => (
                <tr key={p.id}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {p.images[0] ? <img src={p.images[0]} alt="" className="size-10 rounded-md object-cover" /> : <div className="size-10 rounded-md bg-secondary" />}
                      <div><div className="font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{brands.find((b) => b.id === p.brandId)?.name}</div></div>
                    </div>
                  </td>
                  <td className="p-3">{cats.find((c) => c.id === p.categoryId)?.name ?? "—"}</td>
                  <td className="p-3">{formatPrice(p.discountPrice ?? p.price)}</td>
                  <td className={`p-3 ${p.stock === 0 ? "text-destructive" : ""}`}>{p.stock}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      <button aria-label="تعديل" onClick={() => setEdit(structuredClone(p))} className="rounded p-2 hover:bg-secondary"><Pencil className="size-4" /></button>
                      <button aria-label="حذف" onClick={async () => {
                        if (!confirm(`هل تريد حذف "${p.name}"؟`)) return;
                        try { await adminApi.deleteProduct(p.id); await refresh(); toast.success("تم حذف المنتج"); } catch (e) { toast.error(e instanceof Error ? e.message : "تعذّر الحذف"); }
                      }} className="rounded p-2 text-destructive hover:bg-secondary"><Trash2 className="size-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {edit && (
        <ProductForm
          initial={edit}
          cats={cats}
          brands={brands}
          onClose={() => setEdit(null)}
          onSaved={async () => { setEdit(null); await refresh(); toast.success("تم حفظ المنتج"); }}
        />
      )}
    </>
  );
}

function ProductForm({ initial, cats, brands, onClose, onSaved }: {
  initial: Product; cats: { id: string; name: string }[]; brands: { id: string; name: string }[];
  onClose: () => void; onSaved: () => void;
}) {
  const [p, setP] = useState(initial);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const up = (patch: Partial<Product>) => setP({ ...p, ...patch });

  const save = async () => {
    const e: Record<string, string> = {};
    if (!p.name.trim()) e["name"] = "اسم المنتج مطلوب";
    if (!p.categoryId) e["categoryId"] = "يرجى اختيار القسم";
    if (!p.brandId) e["brandId"] = "يرجى اختيار الماركة";
    if (!(p.price > 0)) e["price"] = "يرجى إدخال سعر صحيح";
    if (p.discountPrice != null && p.discountPrice >= p.price) e["discountPrice"] = "سعر الخصم يجب أن يكون أقل من السعر الأصلي";
    if (p.variants.some((v) => !v.label.trim() || !(v.price > 0))) e["variants"] = "يرجى تعبئة اسم وسعر كل خيار";
    setErrs(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const slug = p.slug || p.name.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, "-").replace(/^-|-$/g, "") || `p-${Date.now()}`;
      const stock = p.variants.length ? p.variants.reduce((s, v) => s + v.stock, 0) : p.stock;
      await adminApi.saveProduct({ ...p, slug, stock, specs: p.specs.filter((s) => s.label.trim()) });
      onSaved();
    } catch (x) { toast.error(x instanceof Error ? x.message : "تعذّر الحفظ"); }
    finally { setBusy(false); }
  };

  const num = (v: string) => Number(v.replace(/[^\d.]/g, "")) || 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-start">
      <div className="absolute inset-0 bg-foreground/30" onClick={onClose} />
      <div className="relative mr-auto h-full w-full max-w-2xl overflow-y-auto bg-background shadow-float">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-5 py-3">
          <h2 className="font-semibold">{initial.id ? "تعديل المنتج" : "منتج جديد"}</h2>
          <button aria-label="إغلاق" onClick={onClose}><X className="size-5" /></button>
        </div>
        <div className="space-y-6 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم المنتج" error={errs["name"]} wide><TextInput value={p.name} onChange={(e) => up({ name: e.target.value })} /></Field>
            <Field label="القسم" error={errs["categoryId"]}>
              <SelectInput value={p.categoryId} onChange={(e) => up({ categoryId: e.target.value })}>
                <option value="">اختر القسم</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </SelectInput>
            </Field>
            <Field label="الماركة" error={errs["brandId"]}>
              <SelectInput value={p.brandId} onChange={(e) => up({ brandId: e.target.value })}>
                <option value="">اختر الماركة</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </SelectInput>
            </Field>
            <Field label="الموديل (اختياري)"><TextInput value={p.model ?? ""} onChange={(e) => up({ model: e.target.value || undefined })} /></Field>
            <Field label="الضمان (اختياري)"><TextInput value={p.warranty ?? ""} onChange={(e) => up({ warranty: e.target.value || undefined })} /></Field>
            <Field label="السعر (₪)" error={errs["price"]}><TextInput inputMode="decimal" value={p.price || ""} onChange={(e) => up({ price: num(e.target.value) })} /></Field>
            <Field label="سعر الخصم (اختياري)" error={errs["discountPrice"]}><TextInput inputMode="decimal" value={p.discountPrice ?? ""} onChange={(e) => up({ discountPrice: e.target.value ? num(e.target.value) : undefined })} /></Field>
            {p.variants.length === 0 && <Field label="الكمية في المخزون"><TextInput inputMode="numeric" value={p.stock} onChange={(e) => up({ stock: num(e.target.value) })} /></Field>}
            <Field label="الوصف" wide><TextArea value={p.description} onChange={(e) => up({ description: e.target.value })} /></Field>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">الصور</p>
            <div className="flex flex-wrap gap-2">
              {p.images.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} alt="" className="size-20 rounded-lg border object-cover" />
                  <button aria-label="حذف الصورة" onClick={() => up({ images: p.images.filter((_, k) => k !== i) })} className="absolute -left-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-destructive-foreground"><X className="size-3" /></button>
                </div>
              ))}
              <label className="grid size-20 cursor-pointer place-items-center rounded-lg border border-dashed text-muted-foreground hover:bg-secondary">
                <Plus className="size-5" />
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const f = e.target.files?.[0]; e.target.value = "";
                  if (!f) return;
                  try { const url = await readImage(f); setP((x) => ({ ...x, images: [...x.images, url] })); } catch (x) { toast.error(x instanceof Error ? x.message : "تعذّر رفع الصورة"); }
                }} />
              </label>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">المواصفات</p>
            <div className="space-y-2">
              {p.specs.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <TextInput placeholder="مثال: القدرة" value={s.label} onChange={(e) => up({ specs: p.specs.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)) })} />
                  <TextInput placeholder="مثال: 20 واط" value={s.value} onChange={(e) => up({ specs: p.specs.map((x, k) => (k === i ? { ...x, value: e.target.value } : x)) })} />
                  <button aria-label="حذف" onClick={() => up({ specs: p.specs.filter((_, k) => k !== i) })} className="p-1 text-destructive"><Trash2 className="size-4" /></button>
                </div>
              ))}
            </div>
            <Btn variant="outline" className="mt-2" onClick={() => up({ specs: [...p.specs, { label: "", value: "" }] })}><Plus className="size-4" /> إضافة مواصفة</Btn>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium">الخيارات (السعة، اللون...)</p>
            <p className="mb-2 text-xs text-muted-foreground">إذا أضفت خيارات، يجب على العميل اختيار أحدها قبل الإضافة للسلة.</p>
            <div className="space-y-2">
              {p.variants.map((v, i) => (
                <div key={v.id} className="grid grid-cols-[1fr_90px_90px_70px_auto] gap-2">
                  <TextInput placeholder="مثال: 256GB · أسود" value={v.label} onChange={(e) => up({ variants: p.variants.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)) })} />
                  <TextInput placeholder="السعر" inputMode="decimal" value={v.price || ""} onChange={(e) => up({ variants: p.variants.map((x, k) => (k === i ? { ...x, price: num(e.target.value) } : x)) })} />
                  <TextInput placeholder="الخصم" inputMode="decimal" value={v.discountPrice ?? ""} onChange={(e) => up({ variants: p.variants.map((x, k) => (k === i ? { ...x, discountPrice: e.target.value ? num(e.target.value) : undefined } : x)) })} />
                  <TextInput placeholder="الكمية" inputMode="numeric" value={v.stock} onChange={(e) => up({ variants: p.variants.map((x, k) => (k === i ? { ...x, stock: num(e.target.value) } : x)) })} />
                  <button aria-label="حذف" onClick={() => up({ variants: p.variants.filter((_, k) => k !== i) })} className="p-1 text-destructive"><Trash2 className="size-4" /></button>
                </div>
              ))}
            </div>
            {errs["variants"] && <p className="mt-1 text-xs text-destructive">{errs["variants"]}</p>}
            <Btn variant="outline" className="mt-2" onClick={() => up({ variants: [...p.variants, { id: `v${Date.now()}`, label: "", price: p.price, stock: 0 }] })}><Plus className="size-4" /> إضافة خيار</Btn>
          </div>
        </div>
        <div className="sticky bottom-0 flex gap-2 border-t bg-card px-5 py-3">
          <Btn onClick={save} disabled={busy}>{busy ? "جارٍ الحفظ..." : "حفظ المنتج"}</Btn>
          <Btn variant="outline" onClick={onClose}>إلغاء</Btn>
        </div>
      </div>
    </div>
  );
}
