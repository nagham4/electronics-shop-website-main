import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { readImage } from "@/lib/api/admin";
import { slidesApi, type HeroSlide } from "@/lib/api/slides";
import { Btn, EmptyState, Field, PageHeader, Panel, TextArea, TextInput, Toggle } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/slides")({
  head: () => ({ meta: [
    { title: "إدارة شرائح البانر | تِك ستور" },
    { name: "description", content: "إدارة صور وعروض شرائح البانر في تِك ستور." },
    { property: "og:title", content: "إدارة شرائح البانر | تِك ستور" },
    { property: "og:description", content: "إدارة صور وعروض شرائح البانر في تِك ستور." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "robots", content: "noindex" },
  ] }),
  component: SlidesPage,
});

const blank = (): HeroSlide => ({ id: "", badge: "", title: "", text: "", cta: "تسوّق الآن", link: "/", image: "", isActive: true });

function SlidesPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "slides"], queryFn: slidesApi.adminSlides });
  const [list, setList] = useState<HeroSlide[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setList(data); }, [data]);

  const upd = (i: number, patch: Partial<HeroSlide>) => setList((l) => l.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: number) => setList((l) => {
    const j = i + d; if (j < 0 || j >= l.length) return l;
    const n = [...l]; [n[i], n[j]] = [n[j]!, n[i]!]; return n;
  });
  const pick = async (i: number, f?: File) => {
    if (!f) return;
    try { upd(i, { image: await readImage(f) }); } catch (e) { toast.error(e instanceof Error ? e.message : "تعذّر رفع الصورة"); }
  };

  const save = async () => {
    if (list.some((s) => !s.title.trim() || !s.image)) { toast.error("كل شريحة تحتاج عنواناً وصورة"); return; }
    setBusy(true);
    try {
      await slidesApi.saveSlides(list);
      await qc.invalidateQueries({ queryKey: ["slides"] });
      await qc.invalidateQueries({ queryKey: ["admin", "slides"] });
      toast.success("تم حفظ الشرائح");
    } catch (e) { toast.error(e instanceof Error ? e.message : "تعذّر الحفظ"); }
    finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader
        title="شرائح البانر"
        desc="عدّل صور ونصوص البانر المتحرك في الصفحة الرئيسية، ورتّبها أو أوقف أي شريحة."
        action={<Btn onClick={save} disabled={busy}>{busy ? "جارٍ الحفظ..." : "حفظ التغييرات"}</Btn>}
      />
      {list.length === 0 && <EmptyState>لا توجد شرائح بعد — أضف أول شريحة.</EmptyState>}
      <div className="space-y-4">
        {list.map((s, i) => (
          <Panel key={s.id || `new-${i}`} title={`الشريحة ${i + 1}${s.isActive ? "" : " (موقوفة)"}`}>
            <div className="grid gap-4 md:grid-cols-[200px_minmax(0,1fr)]">
              <div className="space-y-2">
                <label className="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed bg-secondary">
                  {s.image ? <img src={s.image} alt={s.title} className="h-full w-full object-contain" /> : <span className="flex flex-col items-center gap-1 text-xs text-muted-foreground"><ImagePlus className="size-6" /> اختر صورة</span>}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(i, e.target.files?.[0])} />
                </label>
                <div className="flex items-center justify-between">
                  <Toggle checked={s.isActive} onChange={(v) => upd(i, { isActive: v })} label="ظاهرة" />
                  <div className="flex gap-1">
                    <button aria-label="أعلى" onClick={() => move(i, -1)} className="p-1 text-muted-foreground hover:text-foreground"><ArrowUp className="size-4" /></button>
                    <button aria-label="أسفل" onClick={() => move(i, 1)} className="p-1 text-muted-foreground hover:text-foreground"><ArrowDown className="size-4" /></button>
                    <button aria-label="حذف" onClick={() => setList((l) => l.filter((_, k) => k !== i))} className="p-1 text-destructive"><Trash2 className="size-4" /></button>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="العنوان"><TextInput value={s.title} onChange={(e) => upd(i, { title: e.target.value })} /></Field>
                <Field label="الشارة (مثال: خصم 20%)"><TextInput value={s.badge} onChange={(e) => upd(i, { badge: e.target.value })} /></Field>
                <Field label="الوصف" wide><TextArea value={s.text} onChange={(e) => upd(i, { text: e.target.value })} /></Field>
                <Field label="نص الزر"><TextInput value={s.cta} onChange={(e) => upd(i, { cta: e.target.value })} /></Field>
                <Field label="رابط الزر (مثال: /?cat=chargers)"><TextInput dir="ltr" value={s.link} onChange={(e) => upd(i, { link: e.target.value })} /></Field>
              </div>
            </div>
          </Panel>
        ))}
      </div>
      <Btn variant="outline" className="mt-4" onClick={() => setList((l) => [...l, blank()])}><Plus className="size-4" /> إضافة شريحة</Btn>
    </>
  );
}
