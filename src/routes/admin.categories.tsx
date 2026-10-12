import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api/admin";
import type { Brand, Category } from "@/lib/api/types";
import { Btn, PageHeader, Panel, TextInput, Toggle } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({ meta: [
    { title: "إدارة الأقسام والماركات | تِك ستور" },
    { name: "description", content: "إدارة أقسام المنتجات والماركات في تِك ستور." },
    { property: "og:title", content: "إدارة الأقسام والماركات | تِك ستور" },
    { property: "og:description", content: "إدارة أقسام المنتجات والماركات في تِك ستور." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const qc = useQueryClient();
  const { data: catsData } = useQuery({ queryKey: ["admin", "categories"], queryFn: adminApi.categories });
  const { data: brandsData } = useQuery({ queryKey: ["admin", "brands"], queryFn: adminApi.brands });
  const [cats, setCats] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (catsData) setCats(catsData); }, [catsData]);
  useEffect(() => { if (brandsData) setBrands(brandsData); }, [brandsData]);

  const move = (i: number, d: number) => setCats((l) => {
    const j = i + d; if (j < 0 || j >= l.length) return l;
    const n = [...l]; [n[i], n[j]] = [n[j]!, n[i]!]; return n;
  });

  const save = async () => {
    if (cats.some((c) => !c.name.trim()) || brands.some((b) => !b.name.trim())) { toast.error("يرجى تعبئة جميع الأسماء"); return; }
    setBusy(true);
    try {
      await adminApi.saveCategories(cats);
      await adminApi.saveBrands(brands);
      await qc.invalidateQueries();
      toast.success("تم حفظ التغييرات");
    } catch (e) { toast.error(e instanceof Error ? e.message : "تعذّر الحفظ"); }
    finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="الأقسام والماركات" desc="رتّب الأقسام وفعّلها أو أوقفها، وأضف الماركات." action={<Btn onClick={save} disabled={busy}>{busy ? "جارٍ الحفظ..." : "حفظ التغييرات"}</Btn>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="الأقسام">
          <ul className="space-y-2">
            {cats.map((c, i) => (
              <li key={c.id || i} className="flex items-center gap-2">
                <div className="flex flex-col">
                  <button aria-label="أعلى" onClick={() => move(i, -1)} className="text-muted-foreground hover:text-foreground"><ArrowUp className="size-4" /></button>
                  <button aria-label="أسفل" onClick={() => move(i, 1)} className="text-muted-foreground hover:text-foreground"><ArrowDown className="size-4" /></button>
                </div>
                <TextInput value={c.name} onChange={(e) => setCats((l) => l.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
                <Toggle checked={c.isActive} onChange={(v) => setCats((l) => l.map((x, k) => (k === i ? { ...x, isActive: v } : x)))} label="" />
                <button aria-label="حذف" onClick={() => setCats((l) => l.filter((_, k) => k !== i))} className="p-1 text-destructive"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
          <Btn variant="outline" className="mt-4" onClick={() => setCats((l) => [...l, { id: "", name: "", slug: "", sortOrder: l.length + 1, isActive: true }])}><Plus className="size-4" /> إضافة قسم</Btn>
        </Panel>
        <Panel title="الماركات">
          <ul className="space-y-2">
            {brands.map((b, i) => (
              <li key={b.id || i} className="flex items-center gap-2">
                <TextInput value={b.name} onChange={(e) => setBrands((l) => l.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
                <button aria-label="حذف" onClick={() => setBrands((l) => l.filter((_, k) => k !== i))} className="p-1 text-destructive"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
          <Btn variant="outline" className="mt-4" onClick={() => setBrands((l) => [...l, { id: "", name: "" }])}><Plus className="size-4" /> إضافة ماركة</Btn>
        </Panel>
      </div>
    </>
  );
}
