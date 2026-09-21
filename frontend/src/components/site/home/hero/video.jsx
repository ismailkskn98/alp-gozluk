'use client';

import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function HeroVideo({ label, pauseLabel, playLabel }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      return;
    }

    video.pause();
    setIsPlaying(false);
  }

  return (
    <>
      <video
        ref={videoRef}
        className="absolute inset-0 size-full object-cover"
        src="/media/alp-brand-film.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={label}
      />
      <div className="grid-container pointer-events-none absolute inset-x-0 top-5 z-20">
        <button
          type="button"
          onClick={togglePlayback}
          className="pointer-events-auto grid size-9 place-items-center justify-self-end border border-white/45 bg-black/15 text-white backdrop-blur-sm transition-colors hover:bg-black/35"
          aria-label={isPlaying ? pauseLabel : playLabel}
        >
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
      </div>
    </>
  );
}
