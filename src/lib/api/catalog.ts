import { queryOptions } from "@tanstack/react-query";
import { delay, http, isBackendConnected } from "./client";
import { demoBrands, demoCategories, demoProducts, demoSettings } from "./demo-data";
import type { Brand, Category, Product, ProductPage, ProductQuery, StoreSettings } from "./types";

export const effectivePrice = (x: { price: number; discountPrice?: number | undefined }) => x.discountPrice ?? x.price;

const DEVICE_CATEGORIES = ["phones", "tablets", "watches"];
const ACCESSORY_ORDER = ["cases", "chargers", "power", "audio"];

/** Pure filtering used by the sample-data mode (the real API does this server-side). */
export function filterProducts(all: Product[], q: ProductQuery, showOutOfStock = false): ProductPage {
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 12;
  const term = q.search?.trim().toLowerCase();
  let list = all.filter((p) => showOutOfStock || p.stock > 0);
  if (term) {
    list = list.filter((p) => {
      const brand = demoBrands.find((b) => b.id === p.brandId)?.name ?? "";
      const hay = [p.name, brand, p.model ?? "", ...p.specs.map((s) => s.value)].join(" ").toLowerCase();
      return hay.includes(term);
    });
  }
  if (q.categoryId) list = list.filter((p) => p.categoryId === q.categoryId);
  const availableBrandIds = [...new Set(list.map((p) => p.brandId))];
  if (q.brandId) list = list.filter((p) => p.brandId === q.brandId);
  if (q.minPrice != null) list = list.filter((p) => effectivePrice(p) >= q.minPrice!);
  if (q.maxPrice != null) list = list.filter((p) => effectivePrice(p) <= q.maxPrice!);
  const sorted = [...list];
  switch (q.sort ?? "newest") {
    case "price_asc": sorted.sort((a, b) => effectivePrice(a) - effectivePrice(b)); break;
    case "price_desc": sorted.sort((a, b) => effectivePrice(b) - effectivePrice(a)); break;
    case "popular": sorted.sort((a, b) => b.popularity - a.popularity); break;
    default: sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return { items: sorted.slice(0, page * pageSize), total: sorted.length, page, pageSize, availableBrandIds };
}

function toQs(q: ProductQuery) {
  const s = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => v != null && v !== "" && s.set(k, String(v)));
  return s.toString();
}

export const catalogApi = {
  async settings(): Promise<StoreSettings> {
    if (isBackendConnected) return http("/api/settings");
    return demoSettings;
  },
  async categories(): Promise<Category[]> {
    if (isBackendConnected) return http("/api/categories");
    return demoCategories.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async brands(): Promise<Brand[]> {
    if (isBackendConnected) return http("/api/brands");
    return demoBrands;
  },
  async products(q: ProductQuery): Promise<ProductPage> {
    if (isBackendConnected) return http(`/api/products?${toQs(q)}`);
    await delay();
    return filterProducts(demoProducts, q, demoSettings.showOutOfStock);
  },
  async product(slug: string): Promise<Product | null> {
    if (isBackendConnected) return http(`/api/products/${encodeURIComponent(slug)}`);
    return demoProducts.find((p) => p.slug === slug) ?? null;
  },
  async related(p: Product): Promise<Product[]> {
    if (isBackendConnected) return http(`/api/products/${p.id}/related`);
    return demoProducts.filter((x) => x.categoryId === p.categoryId && x.id !== p.id && x.stock > 0).slice(0, 4);
  },
  /** Accessories that fit this device. Backend: GET /api/products/{id}/compatible → Product[] */
  async compatibleAccessories(p: Product): Promise<Product[]> {
    if (isBackendConnected) return http(`/api/products/${p.id}/compatible`);
    if (!DEVICE_CATEGORIES.includes(p.categoryId)) return [];
    const rank = (x: Product) => (x.compatibleWith?.includes(p.slug) ? 0 : 1) + (ACCESSORY_ORDER.indexOf(x.categoryId) / 10);
    return demoProducts
      .filter((x) => ACCESSORY_ORDER.includes(x.categoryId) && x.stock > 0)
      .filter((x) => !x.compatibleWith || x.compatibleWith.includes(p.slug))
      .sort((a, b) => rank(a) - rank(b))
      .slice(0, 8);
  },
};

export const settingsQuery = queryOptions({ queryKey: ["settings"], queryFn: catalogApi.settings, staleTime: 60_000 });
export const categoriesQuery = queryOptions({ queryKey: ["categories"], queryFn: catalogApi.categories, staleTime: 60_000 });
export const brandsQuery = queryOptions({ queryKey: ["brands"], queryFn: catalogApi.brands, staleTime: 60_000 });
export const productQuery = (slug: string) =>
  queryOptions({ queryKey: ["product", slug], queryFn: () => catalogApi.product(slug) });
