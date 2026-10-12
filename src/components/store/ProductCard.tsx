import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Brand, Product } from "@/lib/api/types";
import { formatPrice, useCart } from "@/lib/cart";

export function PriceTag({ price, discountPrice, large }: { price: number; discountPrice?: number | undefined; large?: boolean | undefined }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className={`${large ? "text-2xl" : "text-base"} font-bold ${discountPrice ? "text-sale" : ""}`}>
        {formatPrice(discountPrice ?? price)}
      </span>
      {discountPrice && <span className="text-sm text-muted-foreground line-through">{formatPrice(price)}</span>}
    </div>
  );
}

export function ProductCard({ product, brands }: { product: Product; brands?: Brand[] | undefined }) {
  const { add } = useCart();
  const brand = brands?.find((b) => b.id === product.brandId)?.name;
  const inStock = product.stock > 0;
  const quickAdd = inStock && product.variants.length === 0;
  return (
    <div className="product-card group flex flex-col overflow-hidden rounded-xl border bg-card shadow-card">
      <Link to="/products/$slug" params={{ slug: product.slug }} className="relative block aspect-square bg-secondary">
        <img src={product.images[0]} alt={product.name} loading="lazy" width={816} height={816} className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        {product.discountPrice && (
          <span className="absolute right-2 top-2 rounded-md bg-sale px-2 py-0.5 text-xs font-semibold text-primary-foreground">خصم</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {brand && <span className="text-xs text-muted-foreground">{brand}</span>}
        <Link to="/products/$slug" params={{ slug: product.slug }} className="line-clamp-2 min-h-10 text-sm font-medium leading-5 hover:text-primary">
          {product.name}
        </Link>
        <PriceTag price={product.price} discountPrice={product.discountPrice} />
        <span className={`text-xs ${inStock ? "text-success" : "text-destructive"}`}>{inStock ? "متوفر" : "غير متوفر حالياً"}</span>
        <div className="mt-auto flex gap-2 pt-2">
          <Link to="/products/$slug" params={{ slug: product.slug }} className="flex-1 rounded-lg border py-2 text-center text-sm hover:bg-secondary">
            التفاصيل
          </Link>
          {quickAdd && (
            <button
              aria-label="أضف إلى السلة"
              onClick={() => {
                add({ productId: product.id, slug: product.slug, name: product.name, image: product.images[0] ?? "", unitPrice: product.discountPrice ?? product.price, maxStock: product.stock });
                toast.success("تمت الإضافة إلى السلة");
              }}
              className="grid w-10 place-items-center rounded-lg bg-primary text-primary-foreground hover:opacity-90"
            >
              <Plus className="size-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
