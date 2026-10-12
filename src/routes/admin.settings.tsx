import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api/admin";
import { settingsQuery } from "@/lib/api/catalog";
import type { StoreSettings } from "@/lib/api/types";
import { Btn, Field, PageHeader, Panel, TextArea, TextInput, Toggle } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [
    { title: "إعدادات المتجر | تِك ستور" },
    { name: "description", content: "إدارة بيانات تِك ستور والتوصيل والسياسات." },
    { property: "og:title", content: "إعدادات المتجر | تِك ستور" },
    { property: "og:description", content: "إدارة بيانات تِك ستور والتوصيل والسياسات." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SettingsPage,
});

const themes = [
  { l: "أزرق مخضر", c: "oklch(0.45 0.11 205)" },
  { l: "أزرق", c: "oklch(0.5 0.17 255)" },
  { l: "أخضر", c: "oklch(0.5 0.13 155)" },
  { l: "أحمر", c: "oklch(0.52 0.19 25)" },
  { l: "برتقالي", c: "oklch(0.62 0.17 50)" },
  { l: "رمادي داكن", c: "oklch(0.28 0.02 255)" },
];

function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery(settingsQuery);
  const [s, setS] = useState<StoreSettings | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data) setS(structuredClone(data)); }, [data]);
  if (!s) return <div className="h-40 animate-pulse rounded-xl bg-secondary" />;

  const up = (patch: Partial<StoreSettings>) => setS({ ...s, ...patch });
  const save = async () => {
    if (!s.storeName.trim()) { toast.error("اسم المتجر مطلوب"); return; }
    if (s.whatsapp.enabled && !/^\d{10,15}$/.test(s.whatsapp.phone)) { toast.error("رقم واتساب يجب أن يكون أرقاماً فقط مع رمز الدولة، مثال: 972568046524"); return; }
    setBusy(true);
    try {
      await adminApi.saveSettings(s);
      await qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("تم حفظ الإعدادات");
    } catch (e) { toast.error(e instanceof Error ? e.message : "تعذّر الحفظ"); }
    finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="الإعدادات والمظهر" action={<Btn onClick={save} disabled={busy}>{busy ? "جارٍ الحفظ..." : "حفظ الإعدادات"}</Btn>} />
      <div className="space-y-6">
        <Panel title="لون المتجر">
          <div className="flex flex-wrap gap-3">
            {themes.map((t) => (
              <button key={t.c} onClick={() => up({ themeColor: t.c })} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${s.themeColor === t.c ? "border-foreground" : ""}`}>
                <span className="size-5 rounded-full" style={{ background: t.c }} /> {t.l}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="معلومات المتجر">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم المتجر"><TextInput value={s.storeName} onChange={(e) => up({ storeName: e.target.value })} /></Field>
            <Field label="الوصف المختصر"><TextInput value={s.tagline} onChange={(e) => up({ tagline: e.target.value })} /></Field>
            <Field label="رقم الهاتف"><TextInput dir="ltr" value={s.phone} onChange={(e) => up({ phone: e.target.value })} /></Field>
            <Field label="البريد الإلكتروني"><TextInput dir="ltr" value={s.email} onChange={(e) => up({ email: e.target.value })} /></Field>
            <Field label="العنوان" wide><TextInput value={s.address} onChange={(e) => up({ address: e.target.value })} /></Field>
          </div>
        </Panel>

        <Panel title="زر واتساب">
          <div className="space-y-4">
            <Toggle checked={s.whatsapp.enabled} onChange={(v) => up({ whatsapp: { ...s.whatsapp, enabled: v } })} label="إظهار زر واتساب في المتجر" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="رقم واتساب (مع رمز الدولة، بدون +)"><TextInput dir="ltr" value={s.whatsapp.phone} onChange={(e) => up({ whatsapp: { ...s.whatsapp, phone: e.target.value.replace(/\D/g, "") } })} /></Field>
              <Field label="الرسالة الافتراضية"><TextInput value={s.whatsapp.message} onChange={(e) => up({ whatsapp: { ...s.whatsapp, message: e.target.value } })} /></Field>
            </div>
          </div>
        </Panel>

        <Panel title="الصفحة الرئيسية">
          <div className="space-y-4">
            <Toggle checked={s.banner.enabled} onChange={(v) => up({ banner: { ...s.banner, enabled: v } })} label="إظهار الشريط الترويجي" />
            <Field label="نص الشريط الترويجي"><TextInput value={s.banner.text} onChange={(e) => up({ banner: { ...s.banner, text: e.target.value } })} /></Field>
            <Toggle checked={s.showOutOfStock} onChange={(v) => up({ showOutOfStock: v })} label="عرض المنتجات غير المتوفرة" />
          </div>
        </Panel>

        <Panel title="رسوم التوصيل">
          <ul className="space-y-2">
            {s.shippingFees.map((z, i) => (
              <li key={i} className="flex items-center gap-2">
                <TextInput placeholder="المنطقة" value={z.label} onChange={(e) => up({ shippingFees: s.shippingFees.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)) })} />
                <TextInput className="!w-28" inputMode="numeric" value={z.fee} onChange={(e) => up({ shippingFees: s.shippingFees.map((x, k) => (k === i ? { ...x, fee: Number(e.target.value.replace(/\D/g, "")) } : x)) })} />
                <span className="text-sm">₪</span>
                <button aria-label="حذف" onClick={() => up({ shippingFees: s.shippingFees.filter((_, k) => k !== i) })} className="p-1 text-destructive"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
          <Btn variant="outline" className="mt-3" onClick={() => up({ shippingFees: [...s.shippingFees, { label: "", fee: 0 }] })}><Plus className="size-4" /> إضافة منطقة</Btn>
        </Panel>

        <Panel title="السياسات (تظهر في أسفل الموقع)">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="الشحن والتوصيل"><TextArea value={s.policies.shipping} onChange={(e) => up({ policies: { ...s.policies, shipping: e.target.value } })} /></Field>
            <Field label="الضمان"><TextArea value={s.policies.warranty} onChange={(e) => up({ policies: { ...s.policies, warranty: e.target.value } })} /></Field>
            <Field label="الاستبدال والإرجاع"><TextArea value={s.policies.returns} onChange={(e) => up({ policies: { ...s.policies, returns: e.target.value } })} /></Field>
            <Field label="سياسة الخصوصية"><TextArea value={s.policies.privacy} onChange={(e) => up({ policies: { ...s.policies, privacy: e.target.value } })} /></Field>
          </div>
        </Panel>

        <Panel title="روابط التواصل الاجتماعي">
          <ul className="space-y-2">
            {s.social.map((x, i) => (
              <li key={i} className="flex items-center gap-2">
                <TextInput placeholder="الاسم" value={x.label} onChange={(e) => up({ social: s.social.map((y, k) => (k === i ? { ...y, label: e.target.value } : y)) })} />
                <TextInput placeholder="الرابط" dir="ltr" value={x.url} onChange={(e) => up({ social: s.social.map((y, k) => (k === i ? { ...y, url: e.target.value } : y)) })} />
                <button aria-label="حذف" onClick={() => up({ social: s.social.filter((_, k) => k !== i) })} className="p-1 text-destructive"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
          <Btn variant="outline" className="mt-3" onClick={() => up({ social: [...s.social, { label: "", url: "" }] })}><Plus className="size-4" /> إضافة رابط</Btn>
        </Panel>
      </div>
    </>
  );
}
