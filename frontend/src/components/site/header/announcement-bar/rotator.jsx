'use client';

import { Pause, Play, X } from 'lucide-react';
import NextLink from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';

const reducedMotionQuery = '(prefers-reduced-motion: reduce)';
const subscribeReducedMotion = (callback) => {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
};
const getReducedMotion = () => window.matchMedia(reducedMotionQuery).matches;
const getServerReducedMotion = () => false;

export default function AnnouncementRotator({ announcements, labels }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const prefersReducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, getServerReducedMotion);
  const active = announcements[activeIndex] || announcements[0];
  const hasMultiple = announcements.length > 1;

  useEffect(() => {
    if (!hasMultiple || isPaused || isInteracting || !isVisible || prefersReducedMotion) return undefined;
    const duration = Math.min(60, Math.max(3, Number(active.durationSeconds) || 5)) * 1000;
    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % announcements.length);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [active.durationSeconds, announcements.length, hasMultiple, isInteracting, isPaused, isVisible, prefersReducedMotion]);

  if (!isVisible) return null;

  return (
    <div
      className="relative z-10 min-h-9 border-b border-black/10"
      style={{ backgroundColor: active.backgroundColor, color: active.textColor }}
      onMouseEnter={() => hasMultiple && setIsInteracting(true)}
      onMouseLeave={() => hasMultiple && setIsInteracting(false)}
      onFocusCapture={() => hasMultiple && setIsInteracting(true)}
      onBlurCapture={() => hasMultiple && setIsInteracting(false)}
    >
      <div className="grid-container min-h-9">
        <div className="grid min-h-9 grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center sm:grid-cols-[5rem_minmax(0,1fr)_5rem]">
          <span aria-hidden="true" />
          <p className="flex min-w-0 items-center justify-center text-center text-[0.72rem] leading-5 sm:text-[0.76rem]">
            <span className="truncate font-medium">{active.message}</span>
            {active.linkUrl && active.linkLabel ? (
              <NextLink href={active.linkUrl} className={`ml-1.5 shrink-0 leading-tight hover:opacity-70 ${active.linkUnderline !== false ? 'border-b border-current' : ''}`}>
                {active.linkLabel}
              </NextLink>
            ) : null}
          </p>
          <div className="flex justify-self-end">
            {hasMultiple ? (
              <button type="button" className="grid size-8 place-items-center opacity-70 transition-opacity hover:opacity-100" aria-label={isPaused ? labels.play : labels.pause} onClick={() => setIsPaused((value) => !value)}>
                {isPaused ? <Play className="size-3.5" fill="currentColor" /> : <Pause className="size-3.5" />}
              </button>
            ) : null}
            <button type="button" className="grid size-8 place-items-center opacity-70 transition-opacity hover:opacity-100" aria-label={labels.close} onClick={() => setIsVisible(false)}>
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
