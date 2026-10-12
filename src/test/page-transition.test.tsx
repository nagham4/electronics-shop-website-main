import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageTransition } from "@/components/PageTransition";

const { subscribe } = vi.hoisted(() => ({ subscribe: vi.fn() }));
const router = { subscribe };
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => router,
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  subscribe.mockReset();
});

describe("PageTransition", () => {
  it("animates only the rendered destination, not the old page or search updates", () => {
    const animate = vi.fn(() => ({ cancel: vi.fn() }));
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })));
    const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "animate");
    Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
    const unsubscribe = vi.fn();
    subscribe.mockReturnValue(unsubscribe);
    const view = render(<PageTransition>Old page</PageTransition>);
    expect(animate).not.toHaveBeenCalled();
    expect(subscribe).toHaveBeenCalledWith("onRendered", expect.any(Function));
    const onRendered = subscribe.mock.calls[0]?.[1];
    view.rerender(<PageTransition>New page</PageTransition>);
    expect(animate).not.toHaveBeenCalled();
    onRendered({ pathChanged: true });
    expect(animate).toHaveBeenCalledTimes(1);
    expect(view.container.textContent).toBe("New page");
    onRendered({ pathChanged: false });
    expect(animate).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(unsubscribe).toHaveBeenCalled();
    if (originalAnimate) Object.defineProperty(HTMLElement.prototype, "animate", originalAnimate);
    else Reflect.deleteProperty(HTMLElement.prototype, "animate");
  });
});