'use client';

import { useLayoutEffect, useRef } from 'react';
import { useLenis } from 'lenis/react';
import { usePathname } from '@/i18n/navigation';

export default function RouteScrollReset() {
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const lenis = useLenis();

  useLayoutEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    if (previousPathnameRef.current === pathname) return;
    previousPathnameRef.current = pathname;
    if (window.location.hash) return;

    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    const scrollToTop = () => {
      if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
      else window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    };
    scrollToTop();
    queueMicrotask(scrollToTop);
    const restoreFrame = window.requestAnimationFrame(() => {
      root.style.scrollBehavior = previousScrollBehavior;
    });

    return () => {
      window.cancelAnimationFrame(restoreFrame);
      root.style.scrollBehavior = previousScrollBehavior;
    };
  }, [lenis, pathname]);

  return null;
}
