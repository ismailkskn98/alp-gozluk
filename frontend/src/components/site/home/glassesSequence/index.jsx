"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const FRAME_COUNT = 96;
const LAST_FRAME_INDEX = FRAME_COUNT - 1;
const FRAME_SOURCES = Array.from({ length: FRAME_COUNT }, (_, index) => `/glasses-animation/frames/frame-${String(index + 1).padStart(3, "0")}.jpg`);

export default function GlassesSequence({ imageAlt }) {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const preloadedImagesRef = useRef([]);
  const currentFrameRef = useRef(0);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const image = imageRef.current;

      if (!section || !image) return undefined;

      const preloadedImages = FRAME_SOURCES.map((source) => {
        const frame = new window.Image();
        frame.decoding = "async";
        frame.src = source;
        return frame;
      });
      preloadedImagesRef.current = preloadedImages;

      const media = gsap.matchMedia();

      media.add(
        {
          reduceMotion: "(prefers-reduced-motion: reduce)",
          allowMotion: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          if (context.conditions.reduceMotion) {
            currentFrameRef.current = LAST_FRAME_INDEX;
            image.src = preloadedImages[LAST_FRAME_INDEX].src;
            return undefined;
          }

          currentFrameRef.current = 0;
          image.src = preloadedImages[0].src;

          const sequence = { frame: 0 };

          gsap.to(sequence, {
            frame: LAST_FRAME_INDEX,
            ease: "none",
            onUpdate: () => {
              const nextFrame = Math.round(sequence.frame);

              if (nextFrame === currentFrameRef.current) return;

              currentFrameRef.current = nextFrame;
              image.src = preloadedImages[nextFrame].src;
            },
            scrollTrigger: {
              id: "home-glasses-sequence",
              trigger: section,
              start: "top top",
              end: () => {
                const distance = gsap.utils.clamp(2500, 3000, window.innerHeight * 3.2);
                return `+=${Math.round(distance)}`;
              },
              pin: true,
              scrub: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          return undefined;
        },
      );

      return () => {
        media.revert();
        preloadedImagesRef.current = [];
      };
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="grid min-h-svh place-items-center overflow-hidden bg-white px-[clamp(1rem,4vw,4rem)] py-[clamp(2rem,6vh,5rem)]">
      {/* Scroll sırasında preload edilmiş frame kaynağı doğrudan güncellendiği için yerel img kullanılır. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={FRAME_SOURCES[0]}
        alt={imageAlt}
        // width="640"
        // height="360"
        decoding="async"
        fetchPriority="high"
        className="block h-auto max-h-[70svh] w-full max-w-[80rem] object-contain"
      />
    </section>
  );
}
