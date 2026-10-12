import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { slidesQuery } from "@/lib/api/slides";

const INTERVAL = 4000;

export function HeroSlider() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const { data: slides = [] } = useQuery(slidesQuery);
  const n = slides.length;
  const go = (d: number) => setI((v) => (n ? (v + d + n) % n : 0));

  useEffect(() => {
    if (paused || n < 2) return;
    const t = setTimeout(() => go(1), INTERVAL);
    return () => clearTimeout(t);
  }, [i, paused, n]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!n) return null;

  return (
    <section
      className="relative mt-4 overflow-hidden rounded-2xl border bg-card md:mt-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { setPaused(true); touchX.current = (e.touches[0]?.clientX ?? null); }}
      onTouchEnd={(e) => {
        const s = touchX.current;
        if (s != null) {
          const dx = (e.changedTouches[0]?.clientX ?? s) - s;
          if (Math.abs(dx) > 40) go(dx > 0 ? 1 : -1);
        }
        touchX.current = null;
        setPaused(false);
      }}
      aria-roledescription="carousel"
    >
      <div className="relative h-80 sm:h-72 md:h-80">
        {slides.map((s, idx) => (
          <div
            key={s.id}
            aria-hidden={idx !== i}
            className={`absolute inset-0 grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] grid-rows-[minmax(0,1fr)] items-center transition-opacity duration-700 motion-reduce:transition-none ${idx === i ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <div className="min-h-0 min-w-0 space-y-2 px-4 py-10 sm:space-y-3 sm:px-12">
              {s.badge && <span className="inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">{s.badge}</span>}
              <h2 className="text-xl font-bold sm:text-3xl">{s.title}</h2>
              <p className="text-sm text-muted-foreground sm:text-base">{s.text}</p>
              {s.cta && s.link && <a href={s.link} className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">{s.cta}</a>}
            </div>
            <div className="h-full min-h-0 min-w-0">
              <img src={s.image} alt={s.title} className="block h-full w-full object-contain object-center" loading={idx === 0 ? "eager" : "lazy"} />
            </div>
          </div>
        ))}
      </div>

      <Button variant="ghost" size="icon" onClick={() => go(-1)} aria-label="السابق" title="السابق" className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-background/80 shadow sm:inline-flex"><ChevronRight /></Button>
      <Button variant="ghost" size="icon" onClick={() => go(1)} aria-label="التالي" title="التالي" className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-background/80 shadow sm:inline-flex"><ChevronLeft /></Button>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {slides.map((_, idx) => (
          <Button variant="ghost" key={idx} onClick={() => setI(idx)} aria-label={`الشريحة ${idx + 1}`} aria-pressed={idx === i} className={`h-2 rounded-full p-0 transition-all ${idx === i ? "w-6 bg-primary" : "w-2 bg-muted-foreground/40"}`} />
        ))}
      </div>
    </section>
  );
}
