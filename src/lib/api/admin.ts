// Admin service module. With a backend (VITE_API_BASE_URL) every call goes to the REST API.
// Without one, changes apply to the in-browser sample data only and are lost on reload.
import { http, isBackendConnected, delay } from "./client";
import { demoBrands, demoCategories, demoProducts, demoSettings } from "./demo-data";
import type { Brand, Category, Product, StoreSettings } from "./types";

export interface AdminOrderItem {
  productName: string;
  variantLabel?: string | undefined;
  quantity: number;
  unitPrice: number;
}

export interface AdminOrder {
  orderNumber: string;
  customerName: string;
  phone: string;
  city: string;
  area: string;
  address: string;
  notes?: string | undefined;
  items: AdminOrderItem[];
  shippingFee: number;
  total: number;
  status: "new" | "confirmed" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
}

// Demo orders so the dashboard is explorable before the backend is connected.
const demoOrders: AdminOrder[] = [
  {
    orderNumber: "TS-100245", customerName: "أحمد خليل", phone: "0599123456", city: "الخليل", area: "المدينة", address: "شارع الواد، بناية 12",
    items: [{ productName: "سماعات لاسلكية", quantity: 1, unitPrice: 249 }], shippingFee: 20, total: 269,
    status: "new", createdAt: new Date(Date.now() - 2 * 3600e3).toISOString(),
  },
  {
    orderNumber: "TS-100244", customerName: "سارة عمر", phone: "0567654321", city: "رام الله", area: "الماصيون", address: "شارع القدس، عمارة النور",
    notes: "الاتصال قبل التوصيل",
    items: [{ productName: "هاتف ذكي", variantLabel: "256GB · أسود", quantity: 1, unitPrice: 3299 }, { productName: "شاحن سريع", quantity: 2, unitPrice: 89 }],
    shippingFee: 0, total: 3477, status: "confirmed", createdAt: new Date(Date.now() - 26 * 3600e3).toISOString(),
  },
  {
    orderNumber: "TS-100243", customerName: "محمد ناصر", phone: "0598001122", city: "نابلس", area: "البلدة القديمة", address: "حي الياسمينة",
    items: [{ productName: "ساعة ذكية", quantity: 1, unitPrice: 899 }], shippingFee: 25, total: 924,
    status: "shipped", createdAt: new Date(Date.now() - 2 * 86400e3).toISOString(),
  },
  {
    orderNumber: "TS-100242", customerName: "ليان خالد", phone: "0568112233", city: "الخليل", area: "عين سارة", address: "شارع عين سارة الرئيسي",
    items: [{ productName: "سماعات لاسلكية", quantity: 2, unitPrice: 249 }], shippingFee: 20, total: 518,
    status: "delivered", createdAt: new Date(Date.now() - 4 * 86400e3).toISOString(),
  },
  {
    orderNumber: "TS-100241", customerName: "يوسف حمدان", phone: "0599334455", city: "بيت لحم", area: "وسط البلد", address: "شارع المهد",
    items: [{ productName: "شاحن سريع", quantity: 1, unitPrice: 89 }], shippingFee: 20, total: 109,
    status: "cancelled", createdAt: new Date(Date.now() - 5 * 86400e3).toISOString(),
  },
];

export const orderStatusLabels: Record<AdminOrder["status"], string> = {
  new: "جديد",
  confirmed: "مؤكد",
  shipped: "قيد التوصيل",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

const json = (method: string, body?: unknown): RequestInit => (body === undefined ? { method } : { method, body: JSON.stringify(body) });
const newId = () => `x${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;

export const adminApi = {
  async login(email: string, password: string): Promise<{ token: string }> {
    if (isBackendConnected) return http("/api/admin/auth/login", json("POST", { email, password }));
    await delay();
    return { token: "demo" };
  },

  async products(): Promise<Product[]> {
    if (isBackendConnected) return http("/api/admin/products");
    return [...demoProducts];
  },
  async saveProduct(p: Product): Promise<Product> {
    if (isBackendConnected) return http(p.id ? `/api/admin/products/${p.id}` : "/api/admin/products", json(p.id ? "PUT" : "POST", p));
    await delay();
    if (!p.id) {
      const created = { ...p, id: newId(), createdAt: new Date().toISOString() };
      demoProducts.unshift(created);
      return created;
    }
    const i = demoProducts.findIndex((x) => x.id === p.id);
    if (i >= 0) demoProducts[i] = p;
    return p;
  },
  async deleteProduct(id: string): Promise<void> {
    if (isBackendConnected) return http(`/api/admin/products/${id}`, json("DELETE"));
    const i = demoProducts.findIndex((x) => x.id === id);
    if (i >= 0) demoProducts.splice(i, 1);
  },

  async categories(): Promise<Category[]> {
    if (isBackendConnected) return http("/api/admin/categories");
    return [...demoCategories].sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async saveCategories(list: Category[]): Promise<void> {
    if (isBackendConnected) return http("/api/admin/categories", json("PUT", list));
    await delay();
    demoCategories.splice(0, demoCategories.length, ...list.map((c, i) => ({ ...c, id: c.id || newId(), sortOrder: i + 1 })));
  },

  async brands(): Promise<Brand[]> {
    if (isBackendConnected) return http("/api/admin/brands");
    return [...demoBrands];
  },
  async saveBrands(list: Brand[]): Promise<void> {
    if (isBackendConnected) return http("/api/admin/brands", json("PUT", list));
    await delay();
    demoBrands.splice(0, demoBrands.length, ...list.map((b) => ({ ...b, id: b.id || newId() })));
  },

  async orders(): Promise<AdminOrder[]> {
    if (isBackendConnected) return http("/api/admin/orders");
    return demoOrders.map((o) => structuredClone(o));
  },
  async setOrderStatus(orderNumber: string, status: AdminOrder["status"]): Promise<void> {
    if (isBackendConnected) return http(`/api/admin/orders/${orderNumber}/status`, json("PUT", { status }));
    await delay();
    const o = demoOrders.find((x) => x.orderNumber === orderNumber);
    if (o) o.status = status;
  },

  async saveSettings(s: StoreSettings): Promise<void> {
    if (isBackendConnected) return http("/api/admin/settings", json("PUT", s));
    await delay();
    Object.assign(demoSettings, structuredClone(s));
  },
};

/** Reads an image file as a data URL (preview / upload payload). */
export function readImage(file: File): Promise<string> {
  return new Promise((res, rej) => {
    if (!file.type.startsWith("image/")) return rej(new Error("يرجى اختيار ملف صورة"));
    if (file.size > 3 * 1024 * 1024) return rej(new Error("حجم الصورة يجب ألا يتجاوز 3 ميغابايت"));
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("تعذّرت قراءة الصورة"));
    r.readAsDataURL(file);
  });
}
