import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { settingsQuery } from "@/lib/api/catalog";
import { ordersApi } from "@/lib/api/orders";
import { isBackendConnected } from "@/lib/api/client";
import { formatPrice, useCart } from "@/lib/cart";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "إتمام الطلب | تِك ستور" },
      { name: "description", content: "أدخل بيانات التوصيل وادفع عند الاستلام." },
      { property: "og:title", content: "إتمام الطلب | تِك ستور" },
      { property: "og:description", content: "أدخل بيانات التوصيل وادفع عند الاستلام." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checkout,
});

const schema = z.object({
  fullName: z.string().trim().min(3, "يرجى إدخال الاسم الكامل").max(100),
  phone: z.string().trim().regex(/^(\+?97[02])?0?5\d{8}$/, "رقم الجوال غير صحيح، مثال: 0591234567"),
  city: z.string().trim().min(2, "يرجى إدخال المدينة أو البلدة").max(60),
  area: z.string().trim().min(2, "يرجى إدخال الحي أو المنطقة").max(60),
  address: z.string().trim().min(5, "يرجى إدخال العنوان بالتفصيل").max(250),
  notes: z.string().trim().max(500).optional(),
});
type Form = z.infer<typeof schema>;

const fields: { k: keyof Form; l: string; ph: string; area?: boolean | undefined }[] = [
  { k: "fullName", l: "الاسم الكامل", ph: "مثال: محمد أحمد" },
  { k: "phone", l: "رقم الجوال", ph: "059xxxxxxx" },
  { k: "city", l: "المدينة أو البلدة", ph: "مثال: نابلس" },
  { k: "area", l: "الحي أو المنطقة", ph: "مثال: رفيديا" },
  { k: "address", l: "العنوان بالتفصيل", ph: "الشارع، البناية، علامة مميزة" },
  { k: "notes", l: "ملاحظات على الطلب (اختياري)", ph: "أي تفاصيل إضافية", area: true },
];

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { data: s } = useQuery(settingsQuery);
  const navigate = useNavigate();
  const [form, setForm] = useState<Partial<Form>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [zone, setZone] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  if (items.length === 0)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-semibold">إتمام الطلب — سلتك فارغة</h1>
        <Link to="/" className="mt-4 inline-block text-primary hover:underline">العودة إلى المنتجات</Link>
      </div>
    );

  const fee = s?.shippingFees[zone]?.fee ?? 0;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const r = schema.safeParse(form);
    if (!r.success) {
      const errs: typeof errors = {};
      r.error.issues.forEach((i) => (errs[i.path[0] as keyof Form] ??= i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await ordersApi.create({
        customer: r.data,
        shippingZone: s?.shippingFees[zone]?.label ?? "",
        items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        paymentMethod: "cash_on_delivery",
      });
      clear();
      navigate({ to: "/order-success/$orderNumber", params: { orderNumber: res.orderNumber } });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "حدث خطأ، يرجى المحاولة مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1fr_340px]">
      <div>
        <h1 className="mb-5 text-2xl font-bold">إتمام الطلب</h1>
        <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.k} className={`text-sm ${f.area || f.k === "address" ? "sm:col-span-2" : ""}`}>
              <label htmlFor={`checkout-${f.k}`} className="mb-1 block font-medium">{f.l}</label>
              {f.area ? (
                <textarea id={`checkout-${f.k}`} name={f.k} aria-invalid={Boolean(errors[f.k])} aria-describedby={errors[f.k] ? `checkout-${f.k}-error` : undefined} rows={3} placeholder={f.ph} value={form[f.k] ?? ""} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} className="w-full rounded-lg border border-input bg-background p-2.5" />
              ) : (
                <input id={`checkout-${f.k}`} name={f.k} aria-invalid={Boolean(errors[f.k])} aria-describedby={errors[f.k] ? `checkout-${f.k}-error` : undefined} placeholder={f.ph} dir={f.k === "phone" ? "ltr" : undefined} inputMode={f.k === "phone" ? "tel" : undefined} value={form[f.k] ?? ""} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} className="h-10 w-full rounded-lg border border-input bg-background px-2.5 text-right" />
              )}
              {errors[f.k] && <span id={`checkout-${f.k}-error`} className="mt-1 block text-xs text-destructive">{errors[f.k]}</span>}
            </div>
          ))}
          <div className="text-sm sm:col-span-2">
            <label htmlFor="checkout-shipping-zone" className="mb-1 block font-medium">منطقة التوصيل</label>
            <select id="checkout-shipping-zone" name="shippingZone" value={zone} onChange={(e) => setZone(Number(e.target.value))} className="h-10 w-full rounded-lg border border-input bg-background px-2">
              {s?.shippingFees.map((z, i) => <option key={z.label} value={i}>{z.label} — {formatPrice(z.fee)}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4 rounded-xl border bg-card p-4 text-sm">
          <p className="font-medium">طريقة الدفع</p>
          <p className="mt-1 text-muted-foreground">الدفع نقداً عند الاستلام</p>
        </div>
      </div>
      <aside className="h-fit rounded-xl border bg-card p-4 lg:mt-14">
        <p className="mb-3 font-semibold">ملخص الطلب</p>
        <ul className="space-y-2 text-sm">
          {items.map((i) => (
            <li key={i.key} className="flex justify-between gap-2">
              <span className="text-muted-foreground">{i.name}{i.variantLabel ? ` (${i.variantLabel})` : ""} × {i.quantity}</span>
              <span>{formatPrice(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t pt-3 text-sm">
          <div className="flex justify-between"><span>المجموع الفرعي</span><span>{formatPrice(subtotal)}</span></div>
          <div className="flex justify-between"><span>التوصيل</span><span>{formatPrice(fee)}</span></div>
          <div className="flex justify-between pt-1 text-base font-bold"><span>الإجمالي التقريبي</span><span>{formatPrice(subtotal + fee)}</span></div>
          <p className="text-xs text-muted-foreground">يتم تأكيد الإجمالي النهائي من المتجر عند استلام الطلب.</p>
        </div>
        {!isBackendConnected && (
          <p className="mt-3 rounded-lg bg-secondary p-2.5 text-xs text-muted-foreground">استقبال الطلبات غير مفعّل بعد في هذه النسخة التجريبية.</p>
        )}
        {serverError && <p className="mt-3 rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">{serverError}</p>}
        <button disabled={submitting} className="mt-4 h-11 w-full rounded-lg bg-primary text-primary-foreground disabled:opacity-60">
          {submitting ? "جارٍ إرسال الطلب..." : "تأكيد الطلب"}
        </button>
      </aside>
    </form>
  );
}
