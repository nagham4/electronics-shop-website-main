export interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Brand {
  id: string;
  name: string;
}

export interface ProductVariant {
  id: string;
  label: string; // e.g. "256GB · أسود"
  price: number;
  discountPrice?: number | undefined;
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brandId: string;
  categoryId: string;
  model?: string | undefined;
  price: number;
  discountPrice?: number | undefined;
  stock: number;
  images: string[];
  description: string;
  specs: { label: string; value: string }[];
  warranty?: string | undefined;
  variants: ProductVariant[];
  /** Accessories only: slugs of devices this fits. Undefined = universal (fits any device). */
  compatibleWith?: string[] | undefined;
  popularity: number;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: { enabled: boolean; phone: string; message: string };
  banner: { enabled: boolean; text: string };
  shippingFees: { label: string; fee: number }[];
  showOutOfStock: boolean;
  themeColor: string; // oklch color used as --primary
  policies: { shipping: string; warranty: string; returns: string; privacy: string };
  social: { label: string; url: string }[];
}

export type SortKey = "newest" | "price_asc" | "price_desc" | "popular";

export interface ProductQuery {
  search?: string | undefined;
  categoryId?: string | undefined;
  brandId?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  sort?: SortKey | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  /** brand ids present in the current category (before brand filter) */
  availableBrandIds: string[];
}

export interface OrderRequest {
  customer: {
    fullName: string;
    phone: string;
    city: string;
    area: string;
    address: string;
    notes?: string | undefined;
  };
  shippingZone: string;
  items: { productId: string; variantId?: string | undefined; quantity: number }[];
  paymentMethod: "cash_on_delivery";
}

export interface OrderResponse {
  orderNumber: string;
  total: number;
}
