'use client';

import { useEffect, useRef, useState } from 'react';

const HIDE_DISTANCE = 70;
const SHOW_DISTANCE = 200;

export default function ScrollHeader({ children }) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const downwardDistanceRef = useRef(0);
  const upwardDistanceRef = useRef(0);
  const frameRef = useRef(null);

  useEffect(() => {
    lastScrollYRef.current = Math.max(window.scrollY, 0);

    function updateHeader() {
      const currentScrollY = Math.max(window.scrollY, 0);
      const scrollDelta = currentScrollY - lastScrollYRef.current;

      lastScrollYRef.current = currentScrollY;

      if (currentScrollY === 0) {
        downwardDistanceRef.current = 0;
        upwardDistanceRef.current = 0;
        setIsVisible(true);
        return;
      }

      if (scrollDelta < 0) {
        downwardDistanceRef.current = 0;
        upwardDistanceRef.current += Math.abs(scrollDelta);

        if (upwardDistanceRef.current >= SHOW_DISTANCE) {
          setIsVisible(true);
        }

        return;
      }

      if (scrollDelta > 0) {
        upwardDistanceRef.current = 0;
        downwardDistanceRef.current += scrollDelta;

        if (downwardDistanceRef.current >= HIDE_DISTANCE) {
          setIsVisible(false);
        }
      }
    }

    function handleScroll() {
      if (frameRef.current !== null) return;

      frameRef.current = window.requestAnimationFrame(() => {
        updateHeader();
        frameRef.current = null;
      });
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <header
      data-site-header
      data-visible={isVisible}
      className="site-header sticky top-0 z-40 bg-white text-[#111]"
      inert={isVisible ? undefined : true}
    >
      {children}
    </header>
  );
}
