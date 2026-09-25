"use client";
// beui.dev/components/motion/scroll-animation

import { ReactLenis, useLenis } from "lenis/react";
import { useMotionValue, useReducedMotion } from "motion/react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";

// Lenis' own expo-out curve — the canonical smooth-scroll easing. Kept as a
// named local fn (not a lib/ease token) because tokens are bezier control
// points for the motion lib, while Lenis needs a (t) => number easing fn.
const EASE_SCROLL = (t) => Math.min(1, 1.001 - 2 ** (-10 * t));

const SmoothScrollContext = createContext(null);

function readMetrics(target) {
  if (target instanceof Window) {
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return { y: window.scrollY, max };
  }
  return {
    y: target.scrollTop,
    max: Math.max(0, target.scrollHeight - target.clientHeight),
  };
}

function resolveTop(target, source, offset = 0) {
  if (typeof target === "number") return target + offset;
  if (source instanceof Window) {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return window.scrollY;
    return el.getBoundingClientRect().top + window.scrollY + offset;
  }
  const el = typeof target === "string" ? source.querySelector(target) : target;
  if (!(el instanceof HTMLElement)) return source.scrollTop;
  return el.offsetTop + offset;
}

/** Pushes Lenis' live scroll state into the shared motion values. */
function LenisBridge({ scrollY, progress, velocity, lenisRef }) {
  const lenis = useLenis((instance) => {
    scrollY.set(instance.scroll);
    progress.set(instance.progress);
    velocity.set(instance.velocity);
  });
  useEffect(() => {
    lenisRef.current = lenis ?? null;
    return () => {
      lenisRef.current = null;
    };
  }, [lenis, lenisRef]);
  return null;
}

/** Native scroll listener for the reduced-motion path and the no-provider fallback. */
function useNativeScrollSync(enabled, getTarget, scrollY, progress, velocity) {
  useEffect(() => {
    if (!enabled) return;
    const target = getTarget();
    if (!target) return;
    let lastY = readMetrics(target).y;
    let lastT = performance.now();
    const onScroll = () => {
      const { y, max } = readMetrics(target);
      const now = performance.now();
      const dt = now - lastT || 16;
      scrollY.set(y);
      progress.set(max > 0 ? y / max : 0);
      velocity.set(((y - lastY) / dt) * 16);
      lastY = y;
      lastT = now;
    };
    onScroll();
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [enabled, getTarget, scrollY, progress, velocity]);
}

export function SmoothScroll({ children, root = true, lerp = 0.1, duration = 1.2, orientation = "vertical", wheelMultiplier = 1, touch = false, className }) {
  const reduce = useReducedMotion();
  const scrollY = useMotionValue(0);
  const progress = useMotionValue(0);
  const velocity = useMotionValue(0);
  const lenisRef = useRef(null);
  const containerRef = useRef < HTMLDivElement > null;

  const nativeSource = useCallback(() => (root ? window : containerRef.current), [root]);

  const scrollTo = useCallback(
    (target, options) => {
      const lenis = lenisRef.current;
      if (lenis && !reduce) {
        lenis.scrollTo(target, {
          offset: options?.offset,
          duration: options?.duration,
          immediate: options?.immediate,
        });
        return;
      }
      const source = nativeSource();
      const behavior = reduce || options?.immediate ? "auto" : "smooth";
      const top = resolveTop(target, source ?? window, options?.offset);
      (source ?? window).scrollTo({ top, behavior });
    },
    [reduce, nativeSource],
  );

  // Reduced motion drives the native listener; the Lenis path leaves it
  // disabled and lets LenisBridge feed the values instead.
  useNativeScrollSync(!!reduce, nativeSource, scrollY, progress, velocity);

  const api = useMemo(() => ({ lenis: lenisRef.current, scrollY, progress, velocity, scrollTo }), [scrollY, progress, velocity, scrollTo]);

  if (reduce) {
    return (
      <SmoothScrollContext.Provider value={api}>
        <div ref={containerRef} className={className}>
          {children}
        </div>
      </SmoothScrollContext.Provider>
    );
  }

  return (
    <SmoothScrollContext.Provider value={api}>
      <ReactLenis
        root={root}
        className={className}
        options={{
          lerp,
          duration,
          orientation,
          wheelMultiplier,
          smoothWheel: true,
          syncTouch: touch,
          easing: EASE_SCROLL,
        }}
      >
        <LenisBridge scrollY={scrollY} progress={progress} velocity={velocity} lenisRef={lenisRef} />
        {children}
      </ReactLenis>
    </SmoothScrollContext.Provider>
  );
}

/**
 * Read the page's smooth-scroll state. Inside <SmoothScroll> it returns the
 * shared motion values; outside it falls back to a native window scroll
 * listener so scroll-driven components still work without the provider.
 */
export function useSmoothScroll() {
  const ctx = useContext(SmoothScrollContext);
  const scrollY = useMotionValue(0);
  const progress = useMotionValue(0);
  const velocity = useMotionValue(0);

  const windowSource = useCallback(() => window, []);
  useNativeScrollSync(ctx === null, windowSource, scrollY, progress, velocity);

  const scrollTo = useCallback((target, options) => {
    window.scrollTo({
      top: resolveTop(target, window, options?.offset),
      behavior: options?.immediate ? "auto" : "smooth",
    });
  }, []);

  const fallback = useMemo(() => ({ lenis: null, scrollY, progress, velocity, scrollTo }), [scrollY, progress, velocity, scrollTo]);

  return ctx ?? fallback;
}
