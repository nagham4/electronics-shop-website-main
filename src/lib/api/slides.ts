// Homepage hero slides. Backend: GET /api/slides (public), GET/PUT /api/admin/slides.
// Without a backend, edits apply to in-browser sample data only and are lost on reload.
import { queryOptions } from "@tanstack/react-query";
import { http, isBackendConnected, delay } from "./client";
import phone from "@/assets/p-phone.jpg";
import charger from "@/assets/p-charger.jpg";
import earbuds from "@/assets/p-earbuds.jpg";
import watch from "@/assets/p-watch.jpg";

export interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  text: string;
  cta: string;
  link: string;
  image: string;
  isActive: boolean;
}

const demoSlides: HeroSlide[] = [
  { id: "s1", badge: "وصل حديثاً", title: "iPhone 15 Pro", text: "تيتانيوم، كاميرا احترافية، وأداء لا يُضاهى.", cta: "اكتشف الآن", link: "/products/iphone-15-pro", image: phone, isActive: true },
  { id: "s2", badge: "خصم حتى 20%", title: "شواحن أصلية بأسعار أقل", text: "شواحن سريعة وكوابل وباور بانك من Anker وSamsung وApple.", cta: "تسوّق الشواحن", link: "/?cat=chargers", image: charger, isActive: true },
  { id: "s3", badge: "صوت نقي", title: "سماعات لاسلكية", text: "AirPods وGalaxy Buds بعزل ضوضاء ممتاز.", cta: "تسوّق السماعات", link: "/?cat=audio", image: earbuds, isActive: true },
  { id: "s4", badge: "دفع عند الاستلام", title: "توصيل للضفة والقدس والداخل", text: "توصيل مجاني للطلبات فوق 500 ₪ داخل الضفة.", cta: "ابدأ التسوق", link: "/?cat=watches", image: watch, isActive: true },
];

export const slidesApi = {
  async publicSlides(): Promise<HeroSlide[]> {
    if (isBackendConnected) return http("/api/slides");
    return demoSlides.filter((s) => s.isActive).map((s) => ({ ...s }));
  },
  async adminSlides(): Promise<HeroSlide[]> {
    if (isBackendConnected) return http("/api/admin/slides");
    return demoSlides.map((s) => ({ ...s }));
  },
  async saveSlides(list: HeroSlide[]): Promise<void> {
    if (isBackendConnected) return http("/api/admin/slides", { method: "PUT", body: JSON.stringify(list) });
    await delay();
    demoSlides.splice(0, demoSlides.length, ...list.map((s) => ({ ...s, id: s.id || `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}` })));
  },
};

export const slidesQuery = queryOptions({ queryKey: ["slides"], queryFn: slidesApi.publicSlides, staleTime: 60_000 });
