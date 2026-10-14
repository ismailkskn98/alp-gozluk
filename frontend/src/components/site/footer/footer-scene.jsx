"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import FooterGlasses from "./footer-glasses";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const FOOTER_PERSPECTIVE = 1400;

function getExitDepth(isMobile) {
  const viewportRatio = window.innerHeight / window.innerWidth;
  const targetZoom = isMobile ? Math.min(5.6, Math.max(4.8, viewportRatio * 2.35)) : Math.min(3.35, Math.max(2.9, viewportRatio * 4.4));

  return FOOTER_PERSPECTIVE - FOOTER_PERSPECTIVE / targetZoom;
}

export default function FooterScene({ children }) {
  const sceneRef = useRef(null);

  useGSAP(
    () => {
      const scene = sceneRef.current;
      if (!scene) return undefined;

      const footer = scene.querySelector("[data-footer-scene]");
      const glasses = scene.querySelector("[data-footer-glasses]");
      const glassesImage = glasses.querySelector("[data-footer-glasses-image]");
      const lensFilter = scene.querySelector("[data-footer-lens-filter]");
      const opticalVignette = scene.querySelector("[data-footer-optical-vignette]");
      const copyGroups = scene.querySelectorAll("[data-footer-copy]");
      const scrollCue = scene.querySelector("[data-footer-scroll-cue]");
      const media = gsap.matchMedia();

      media.add(
        {
          reduceMotion: "(prefers-reduced-motion: reduce)",
          allowMotion: "(prefers-reduced-motion: no-preference)",
          mobile: "(max-width: 47.999rem)",
        },
        (context) => {
          const { reduceMotion, mobile } = context.conditions;

          if (reduceMotion) {
            gsap.set(scene, { height: "100svh" });
            gsap.set(lensFilter, { opacity: 0.58 });
            gsap.set(opticalVignette, { opacity: 0.82 });
            gsap.set(glasses, { opacity: 0, visibility: "hidden" });
            gsap.set(copyGroups, { opacity: 1 });
            gsap.set(scrollCue, { opacity: 0 });
            return undefined;
          }

          const startZ = mobile ? -760 : -900;
          const startScale = mobile ? 0.96 : 0.92;
          const startProjection = FOOTER_PERSPECTIVE / (FOOTER_PERSPECTIVE - startZ);
          const startY = () => -(footer.clientHeight / (2 * startProjection) + (glassesImage.offsetHeight * startScale) / 2 + 24 / startProjection);
          const entryDistance = footer.clientHeight;
          const pinnedDistance = Math.max(scene.clientHeight - footer.clientHeight, 1);
          const pinnedStart = entryDistance;
          const pinnedPosition = (progress) => pinnedStart + pinnedDistance * progress;
          const fadeStart = mobile ? 0.9 : 0.84;

          gsap.set(glasses, {
            force3D: true,
            opacity: 0.98,
            rotationX: mobile ? -34 : -42,
            rotationZ: mobile ? -0.55 : 0.4,
            scale: startScale,
            transformOrigin: "50% 50%",
            visibility: "visible",
            xPercent: mobile ? -1.8 : 1.2,
            y: startY,
            z: startZ,
          });
          gsap.set(glassesImage, { opacity: 1 });
          gsap.set(copyGroups, { opacity: 0.54 });
          gsap.set(lensFilter, { opacity: 0 });
          gsap.set(opticalVignette, { opacity: 0 });

          const timeline = gsap.timeline({
            defaults: { ease: "none" },
            paused: true,
          });

          timeline
            .to(
              glasses,
              {
                rotationX: mobile ? -24 : -28,
                rotationZ: mobile ? -0.2 : 0.14,
                scale: 0.98,
                xPercent: mobile ? -0.7 : 0.45,
                y: () => -window.innerHeight * (mobile ? 0.2 : 0.24),
                z: mobile ? -420 : -520,
                duration: entryDistance,
                ease: "sine.out",
              },
              0,
            )
            .to(copyGroups, { opacity: 0.68, duration: entryDistance * 0.5 }, entryDistance * 0.35)
            .to(scrollCue, { opacity: 0, yPercent: 45, duration: entryDistance * 0.35 }, entryDistance * 0.65)
            .to(
              glasses,
              {
                scale: mobile ? 1.08 : 1.02,
                rotationZ: 0,
                xPercent: 0,
                y: 0,
                z: -60,
                duration: pinnedDistance * 0.5,
                ease: "sine.inOut",
              },
              pinnedStart,
            )
            .to(
              glasses,
              {
                rotationX: 0,
                duration: pinnedDistance * 0.88,
                ease: "sine.inOut",
              },
              pinnedPosition(0.04),
            )
            .to(copyGroups, { opacity: 0.84, duration: pinnedDistance * 0.38 }, pinnedStart)
            .to(
              glasses,
              {
                scale: 1.02,
                y: () => -window.innerHeight * (mobile ? 0.04 : 0.02),
                z: () => getExitDepth(mobile),
                duration: pinnedDistance * 0.5,
                ease: "sine.in",
              },
              pinnedPosition(0.5),
            )
            .to(
              glassesImage,
              {
                opacity: 0.68,
                duration: pinnedDistance * 0.34,
                ease: "sine.inOut",
              },
              pinnedPosition(0.56),
            )
            .to(
              glasses,
              {
                autoAlpha: 0,
                duration: pinnedDistance * (1 - fadeStart),
                ease: "sine.in",
              },
              pinnedPosition(fadeStart),
            )
            .to(lensFilter, { opacity: 0.58, duration: pinnedDistance * 0.52, ease: "sine.inOut" }, pinnedPosition(0.48))
            .to(opticalVignette, { opacity: 0.82, duration: pinnedDistance * 0.68, ease: "sine.inOut" }, pinnedPosition(0.32))
            .to(copyGroups, { opacity: 1, duration: pinnedDistance * 0.5 }, pinnedPosition(0.5));

          const getScrollProgress = () => gsap.utils.clamp(0, 1, (window.innerHeight - scene.getBoundingClientRect().top) / scene.clientHeight);
          let currentProgress = getScrollProgress();
          let targetProgress = currentProgress;
          let isRendering = false;

          const renderProgress = () => {
            const smoothing = 1 - 0.8 ** gsap.ticker.deltaRatio(60);
            currentProgress += (targetProgress - currentProgress) * smoothing;

            if (Math.abs(targetProgress - currentProgress) < 0.0003) {
              currentProgress = targetProgress;
              isRendering = false;
              gsap.ticker.remove(renderProgress);
            }

            timeline.progress(currentProgress, false);
          };
          const updateProgress = () => {
            targetProgress = getScrollProgress();
            if (isRendering) return;

            isRendering = true;
            gsap.ticker.add(renderProgress);
          };

          timeline.progress(currentProgress, false);

          const scrollDriver = ScrollTrigger.create({
            id: "footer-sunglasses-motion",
            trigger: scene,
            start: "top bottom",
            end: "bottom bottom",
            invalidateOnRefresh: true,
            onRefresh: updateProgress,
            onUpdate: updateProgress,
          });
          window.addEventListener("scroll", updateProgress, { passive: true });

          return () => {
            window.removeEventListener("scroll", updateProgress);
            gsap.ticker.remove(renderProgress);
            scrollDriver.kill();
          };
        },
      );

      return () => media.revert();
    },
    { scope: sceneRef },
  );

  return (
    <div ref={sceneRef} className="footer-scene-track relative" style={{ height: "var(--footer-scene-height, 245svh)" }}>
      <footer data-footer-scene className="sticky top-0 isolate h-svh overflow-hidden bg-[#dba666] text-white [perspective:1400px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 bg-[#e0aa68]"
          style={{
            backgroundImage: "radial-gradient(circle at 50% 17%, #fffef2 0%, #fff4c9 13%, #efcb89 38%, #dca462 70%, #ba7546 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[16%] z-[1] size-[clamp(13rem,27vw,31rem)] -translate-x-1/2 rounded-full bg-[#fffde8] shadow-[0_0_clamp(5rem,14vw,15rem)_clamp(2rem,7vw,8rem)_rgba(255,250,202,0.9)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-[-10%] top-[-12%] z-[2] h-[72%] bg-[radial-gradient(ellipse_at_center,rgba(255,255,244,0.96)_0%,rgba(255,246,202,0.5)_42%,transparent_74%)]"
        />
        <div aria-hidden="true" className="absolute -bottom-[27%] -left-[12%] z-[3] h-[58%] w-[82%] rounded-[50%] bg-[#cf925e]/70" />
        <div aria-hidden="true" className="absolute -bottom-[31%] -right-[20%] z-[3] h-[53%] w-[88%] rounded-[50%] bg-[#b9754f]/45" />
        <div data-footer-lens-filter aria-hidden="true" className="absolute inset-0 z-[5] bg-[linear-gradient(180deg,#26302b_0%,#19211d_58%,#101713_100%)] will-change-[opacity]" />
        <div
          data-footer-optical-vignette
          aria-hidden="true"
          className="absolute inset-0 z-[6] bg-[radial-gradient(ellipse_at_50%_44%,transparent_0%,rgba(8,14,11,0.04)_34%,rgba(6,12,9,0.34)_72%,rgba(0,0,0,0.78)_100%)] will-change-[opacity]"
        />

        <div className="relative z-10 h-full">{children}</div>

        <div
          data-footer-glasses
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center will-change-transform [backface-visibility:hidden] [transform-style:preserve-3d]"
        >
          <FooterGlasses />
        </div>
      </footer>
    </div>
  );
}
