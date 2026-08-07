import { useEffect, useRef, useState } from "react";

/**
 * Returns a ref + `visible` boolean. Once the element enters the viewport
 * the observer disconnects so the animation only fires once.
 */
export function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (visible) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, visible]);

  return { ref, visible };
}
