// Sample catalog used ONLY while no real backend is configured (VITE_API_BASE_URL).
import phone from "@/assets/p-phone.jpg";
import earbuds from "@/assets/p-earbuds.jpg";
import watch from "@/assets/p-watch.jpg";
import charger from "@/assets/p-charger.jpg";
import caseImg from "@/assets/p-case.jpg";
import type { Brand, Category, Product, StoreSettings } from "./types";

export const demoCategories: Category[] = [
  { id: "phones", name: "الجوالات", slug: "phones", sortOrder: 1, isActive: true },
  { id: "tablets", name: "الأجهزة اللوحية", slug: "tablets", sortOrder: 2, isActive: true },
  { id: "watches", name: "الساعات الذكية", slug: "watches", sortOrder: 3, isActive: true },
  { id: "audio", name: "السماعات", slug: "audio", sortOrder: 4, isActive: true },
  { id: "chargers", name: "الشواحن والكابلات", slug: "chargers", sortOrder: 5, isActive: true },
  { id: "cases", name: "الكفرات وواقيات الشاشة", slug: "cases", sortOrder: 6, isActive: true },
  { id: "power", name: "الباور بانك", slug: "power", sortOrder: 7, isActive: true },
];

export const demoBrands: Brand[] = [
  { id: "apple", name: "Apple" },
  { id: "samsung", name: "Samsung" },
  { id: "xiaomi", name: "Xiaomi" },
  { id: "huawei", name: "Huawei" },
  { id: "anker", name: "Anker" },
];

let n = 0;
function p(x: Omit<Product, "id" | "createdAt" | "popularity" | "variants" | "specs" | "description"> & Partial<Product>): Product {
  n++;
  return {
    id: `p${n}`,
    createdAt: new Date(2026, 8, 30 - n).toISOString(),
    popularity: (n * 37) % 100,
    variants: [],
    specs: [],
    description: "منتج أصلي بضمان معتمد، يصلك بتغليفه الأصلي مع جميع الملحقات.",
    ...x,
  };
}

export const demoProducts: Product[] = [
  p({
    slug: "iphone-15-pro", name: "iPhone 15 Pro", brandId: "apple", categoryId: "phones", model: "A3102",
    price: 4290, stock: 8, images: [phone], warranty: "ضمان سنة من الوكيل",
    description: "هاتف iPhone 15 Pro بهيكل من التيتانيوم وكاميرا احترافية ثلاثية وشريحة A17 Pro.",
    specs: [{ label: "الشاشة", value: "6.1 إنش Super Retina XDR" }, { label: "المعالج", value: "A17 Pro" }, { label: "الكاميرا", value: "48 ميغابكسل" }],
    variants: [
      { id: "v1", label: "128GB · تيتانيوم أسود", price: 4290, stock: 4 },
      { id: "v2", label: "256GB · تيتانيوم أسود", price: 4790, stock: 3 },
      { id: "v3", label: "512GB · تيتانيوم طبيعي", price: 5590, stock: 0 },
    ],
  }),
  p({ slug: "galaxy-s24", name: "Galaxy S24", brandId: "samsung", categoryId: "phones", model: "SM-S921", price: 3290, discountPrice: 2990, stock: 6, images: [phone],
    warranty: "ضمان سنة", specs: [{ label: "الشاشة", value: "6.2 إنش AMOLED" }, { label: "الذاكرة", value: "8GB" }],
    variants: [{ id: "v1", label: "128GB · رمادي", price: 3290, discountPrice: 2990, stock: 3 }, { id: "v2", label: "256GB · بنفسجي", price: 3590, discountPrice: 3290, stock: 3 }] }),
  p({ slug: "redmi-note-13", name: "Redmi Note 13", brandId: "xiaomi", categoryId: "phones", price: 990, stock: 15, images: [phone],
    specs: [{ label: "البطارية", value: "5000 ملي أمبير" }, { label: "التخزين", value: "256GB" }] }),
  p({ slug: "airpods-pro-2", name: "AirPods Pro 2", brandId: "apple", categoryId: "audio", price: 990, discountPrice: 890, stock: 12, images: [earbuds],
    warranty: "ضمان سنة", specs: [{ label: "إلغاء الضوضاء", value: "نشط" }, { label: "منفذ الشحن", value: "USB-C" }] }),
  p({ slug: "galaxy-buds-fe", name: "Galaxy Buds FE", brandId: "samsung", categoryId: "audio", price: 390, stock: 9, images: [earbuds] }),
  p({ slug: "freebuds-5i", name: "FreeBuds 5i", brandId: "huawei", categoryId: "audio", price: 320, stock: 0, images: [earbuds] }),
  p({ slug: "apple-watch-se", name: "Apple Watch SE", brandId: "apple", categoryId: "watches", price: 1150, stock: 5, images: [watch],
    variants: [{ id: "v1", label: "40 ملم", price: 1150, stock: 2 }, { id: "v2", label: "44 ملم", price: 1290, stock: 3 }] }),
  p({ slug: "galaxy-watch-6", name: "Galaxy Watch 6", brandId: "samsung", categoryId: "watches", price: 1090, discountPrice: 949, stock: 4, images: [watch] }),
  p({ slug: "huawei-watch-fit-3", name: "Watch Fit 3", brandId: "huawei", categoryId: "watches", price: 520, stock: 7, images: [watch] }),
  p({ slug: "anker-nano-20w", name: "شاحن Anker Nano بقوة 20 واط", brandId: "anker", categoryId: "chargers", price: 79, stock: 40, images: [charger],
    specs: [{ label: "القدرة", value: "20 واط" }, { label: "نوع المنفذ", value: "USB-C" }, { label: "عدد المنافذ", value: "1" }, { label: "بروتوكول الشحن", value: "PD 3.0" }] }),
  p({ slug: "samsung-25w", name: "شاحن Samsung سريع 25 واط", brandId: "samsung", categoryId: "chargers", price: 89, stock: 25, images: [charger],
    compatibleWith: ["galaxy-s24", "redmi-note-13"] }),
  p({ slug: "apple-usbc-cable", name: "كابل Apple USB-C مضفّر", brandId: "apple", categoryId: "chargers", price: 95, stock: 30, images: [charger],
    compatibleWith: ["iphone-15-pro", "airpods-pro-2"] }),
  p({ slug: "anker-powercore-10k", name: "باور بانك Anker بسعة 10000", brandId: "anker", categoryId: "power", price: 149, discountPrice: 129, stock: 18, images: [charger] }),
  p({ slug: "xiaomi-powerbank-20k", name: "باور بانك Xiaomi بسعة 20000", brandId: "xiaomi", categoryId: "power", price: 139, stock: 11, images: [charger] }),
  p({ slug: "iphone-15-pro-clear-case", name: "كفر شفاف MagSafe لـ iPhone 15 Pro", brandId: "apple", categoryId: "cases", price: 69, stock: 20, images: [caseImg],
    compatibleWith: ["iphone-15-pro"] }),
  p({ slug: "iphone-15-pro-glass", name: "حماية شاشة زجاجية لـ iPhone 15 Pro", brandId: "anker", categoryId: "cases", price: 39, stock: 35, images: [caseImg],
    compatibleWith: ["iphone-15-pro"] }),
  p({ slug: "galaxy-s24-case", name: "كفر سيليكون لـ Galaxy S24", brandId: "samsung", categoryId: "cases", price: 59, discountPrice: 49, stock: 14, images: [caseImg],
    compatibleWith: ["galaxy-s24"] }),
  p({ slug: "galaxy-s24-glass", name: "حماية شاشة لـ Galaxy S24", brandId: "samsung", categoryId: "cases", price: 35, stock: 22, images: [caseImg],
    compatibleWith: ["galaxy-s24"] }),
  p({ slug: "redmi-note-13-case", name: "كفر حماية لـ Redmi Note 13", brandId: "xiaomi", categoryId: "cases", price: 35, stock: 18, images: [caseImg],
    compatibleWith: ["redmi-note-13"] }),
];

export const demoSettings: StoreSettings = {
  storeName: "تِك ستور",
  tagline: "إلكترونيات أصلية بضمان، توصيل لجميع المناطق",
  phone: "+970 59 000 0000",
  email: "info@techstore.ps",
  address: "رام الله، شارع الإرسال",
  whatsapp: { enabled: true, phone: "972568046524", message: "مرحباً، أود الاستفسار عن أحد المنتجات" },
  banner: { enabled: true, text: "توصيل مجاني للطلبات فوق 500 ₪ داخل الضفة" },
  shippingFees: [
    { label: "الضفة الغربية", fee: 20 },
    { label: "القدس", fee: 30 },
    { label: "الداخل المحتل", fee: 70 },
  ],
  showOutOfStock: false,
  themeColor: "oklch(0.45 0.11 205)",
  policies: {
    shipping: "يتم التوصيل خلال 1-3 أيام عمل.",
    warranty: "جميع الأجهزة مكفولة بضمان الوكيل.",
    returns: "يمكن الاستبدال خلال 7 أيام في حال وجود عيب مصنعي.",
    privacy: "نحافظ على خصوصية بياناتك ولا نشاركها مع أي جهة.",
  },
  social: [{ label: "فيسبوك", url: "#" }, { label: "إنستغرام", url: "#" }],
};
