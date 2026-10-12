import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/order-success/$orderNumber")({
  head: () => ({
    meta: [
      { title: "تم استلام طلبك | تِك ستور" },
      { name: "description", content: "شكراً لطلبك، سنتواصل معك قريباً لتأكيد التوصيل." },
      { property: "og:title", content: "تم استلام طلبك | تِك ستور" },
      { property: "og:description", content: "شكراً لطلبك، سنتواصل معك قريباً." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Success,
});

function Success() {
  const { orderNumber } = Route.useParams();
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <CheckCircle2 className="mx-auto size-14 text-success" />
      <h1 className="mt-4 text-2xl font-bold">تم استلام طلبك بنجاح</h1>
      <p className="mt-2 text-muted-foreground">رقم الطلب</p>
      <p className="mt-1 text-xl font-semibold" dir="ltr">{orderNumber}</p>
      <p className="mt-4 text-sm text-muted-foreground">سنتواصل معك هاتفياً لتأكيد الطلب وموعد التوصيل. الدفع عند الاستلام.</p>
      <Link to="/" className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm text-primary-foreground">متابعة التسوق</Link>
    </div>
  );
}
