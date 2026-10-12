import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";

/** Animate navigation without remounting the page or resetting its form state. */
export function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = container.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!element || reducedMotion.matches || !element.animate) return;

    let animation: Animation | undefined;
    // The URL changes before React commits the destination. Wait for the
    // router's rendered acknowledgement instead of animating the old outlet.
    const unsubscribe = router.subscribe("onRendered", ({ pathChanged }) => {
      if (!pathChanged || reducedMotion.matches) return;
      animation?.cancel();
      animation = element.animate(
        [
          { opacity: 0, transform: "translateY(10px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    });
    const onPreferenceChange = () => {
      if (reducedMotion.matches) animation?.cancel();
    };
    reducedMotion.addEventListener("change", onPreferenceChange);
    return () => {
      unsubscribe();
      animation?.cancel();
      reducedMotion.removeEventListener("change", onPreferenceChange);
    };
  }, [router]);

  return <div ref={container} className="page-transition min-w-0">{children}</div>;
}