"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import Image from "next/image";

import FooterGlasses from "./footer-glasses";
import { FOOTER_GLASSES_MODE } from "./footer-glasses-mode";

const FooterGlasses3D = dynamic(() => import("./footer-glasses-3d"), {
  loading: () => null,
  ssr: false,
});

gsap.registerPlugin(useGSAP, ScrollTrigger);

const FOOTER_PERSPECTIVE = 1400;

function getExitDepth(isMobile) {
  const viewportRatio = window.innerHeight / window.innerWidth;
  const targetZoom = isMobile ? Math.min(5.6, Math.max(4.8, viewportRatio * 2.35)) : Math.min(3.35, Math.max(2.9, viewportRatio * 4.4));

  return FOOTER_PERSPECTIVE - FOOTER_PERSPECTIVE / targetZoom;
}

export default function FooterScene({ children }) {
  const sceneRef = useRef(null);
  const [shouldLoad3D, setShouldLoad3D] = useState(false);
  const [modelController, setModelController] = useState(null);
  const uses3DGlasses = FOOTER_GLASSES_MODE === "3d";
  const handleModelReady = useCallback((controller) => setModelController(controller), []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!uses3DGlasses || !scene || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setShouldLoad3D(true);
        observer.disconnect();
      },
      { rootMargin: "250% 0px" },
    );

    observer.observe(scene);
    return () => observer.disconnect();
  }, [uses3DGlasses]);

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

          const entryDistance = footer.clientHeight;
          const pinnedDistance = Math.max(scene.clientHeight - footer.clientHeight, 1);
          const pinnedStart = entryDistance;
          const pinnedPosition = (progress) => pinnedStart + pinnedDistance * progress;
          const fadeStart = uses3DGlasses ? (mobile ? 0.72 : 0.68) : mobile ? 0.9 : 0.84;
          const fadeEnd = uses3DGlasses ? 0.92 : 1;
          const scrollPacing = mobile ? 1.32 : 1.42;

          gsap.set(copyGroups, { opacity: 0.54 });
          gsap.set(lensFilter, { opacity: 0 });
          gsap.set(opticalVignette, { opacity: 0 });

          if (uses3DGlasses && !modelController) {
            gsap.set(glasses, { autoAlpha: 0 });
            return undefined;
          }

          gsap.set(glasses, { autoAlpha: 1 });
          gsap.set(glassesImage, { opacity: 1 });

          const timeline = gsap.timeline({
            defaults: { ease: "none" },
            paused: true,
          });

          if (uses3DGlasses) {
            const { group, viewport } = modelController;
            const fittedScale = viewport.width * (mobile ? 1.24 : 1.14);
            const startScale = fittedScale * (mobile ? 0.9 : 0.88);
            const entryScale = fittedScale * 0.98;
            const settledScale = fittedScale * (mobile ? 1.05 : 1);

            gsap.set(group.position, {
              x: viewport.width * (mobile ? -0.018 : 0.012),
              y: viewport.height * 0.9,
              z: mobile ? 2.5 : 3.2,
            });
            gsap.set(group.rotation, {
              x: mobile ? 0.76 : 0.9,
              y: 0,
              z: mobile ? -0.01 : 0.007,
            });
            gsap.set(group.scale, { x: startScale, y: startScale, z: startScale });

            timeline
              .to(
                group.position,
                {
                  x: viewport.width * (mobile ? -0.007 : 0.0045),
                  y: viewport.height * (mobile ? 0.2 : 0.24),
                  z: mobile ? 1.15 : 1.45,
                  duration: entryDistance,
                  ease: "sine.out",
                },
                0,
              )
              .to(group.rotation, { x: 0, z: mobile ? -0.0035 : 0.0025, duration: entryDistance, ease: "sine.out" }, 0)
              .to(group.scale, { x: entryScale, y: entryScale, z: entryScale, duration: entryDistance, ease: "sine.out" }, 0)
              .to(
                group.position,
                { x: 0, y: 0, z: 0, duration: pinnedDistance * 0.5, ease: "sine.inOut" },
                pinnedStart,
              )
              .to(group.rotation, { z: 0, duration: pinnedDistance * 0.5, ease: "sine.inOut" }, pinnedStart)
              .to(
                group.scale,
                { x: settledScale, y: settledScale, z: settledScale, duration: pinnedDistance * 0.5, ease: "sine.inOut" },
                pinnedStart,
              )
              .to(
                group.position,
                {
                  y: viewport.height * (mobile ? 0.04 : 0.02),
                  z: -5.05,
                  duration: pinnedDistance * 0.5,
                  ease: "sine.in",
                },
                pinnedPosition(0.5),
              );
          } else {
            const startZ = mobile ? -760 : -900;
            const startScale = mobile ? 0.96 : 0.92;
            const startProjection = FOOTER_PERSPECTIVE / (FOOTER_PERSPECTIVE - startZ);
            const startY = () => -(footer.clientHeight / (2 * startProjection) + (glassesImage.offsetHeight * startScale) / 2 + 24 / startProjection);

            gsap.set(glasses, {
              force3D: true,
              opacity: 0.98,
              rotationX: mobile ? 42 : 50,
              rotationZ: mobile ? -0.55 : 0.4,
              scale: startScale,
              transformOrigin: "50% 50%",
              visibility: "visible",
              xPercent: mobile ? -1.8 : 1.2,
              y: startY,
              z: startZ,
            });

            timeline
              .to(
                glasses,
                {
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
              .to(glasses, { rotationX: 0, duration: entryDistance, ease: "sine.out" }, 0)
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
                  scale: 1.02,
                  y: () => -window.innerHeight * (mobile ? 0.04 : 0.02),
                  z: () => getExitDepth(mobile),
                  duration: pinnedDistance * 0.5,
                  ease: "sine.in",
                },
                pinnedPosition(0.5),
              );
          }

          timeline
            .to(copyGroups, { opacity: 0.68, duration: entryDistance * 0.5 }, entryDistance * 0.35)
            .to(scrollCue, { opacity: 0, yPercent: 45, duration: entryDistance * 0.35 }, entryDistance * 0.65)
            .to(copyGroups, { opacity: 0.84, duration: pinnedDistance * 0.38 }, pinnedStart)
            .to(glassesImage, { opacity: 0.68, duration: pinnedDistance * 0.34, ease: "sine.inOut" }, pinnedPosition(0.56))
            .to(glasses, { autoAlpha: 0, duration: pinnedDistance * (fadeEnd - fadeStart), ease: "sine.in" }, pinnedPosition(fadeStart))
            .to(lensFilter, { opacity: 0.58, duration: pinnedDistance * 0.52, ease: "sine.inOut" }, pinnedPosition(0.48))
            .to(opticalVignette, { opacity: 0.82, duration: pinnedDistance * 0.68, ease: "sine.inOut" }, pinnedPosition(0.32))
            .to(copyGroups, { opacity: 1, duration: pinnedDistance * 0.5 }, pinnedPosition(0.5));

          const getScrollProgress = () => {
            const rawProgress = gsap.utils.clamp(0, 1, (window.innerHeight - scene.getBoundingClientRect().top) / scene.clientHeight);

            return 1 - (1 - rawProgress) ** scrollPacing;
          };
          let currentProgress = getScrollProgress();
          let targetProgress = currentProgress;
          let isRendering = false;

          const renderProgress = () => {
            const smoothing = 1 - 0.9 ** gsap.ticker.deltaRatio(60);
            currentProgress += (targetProgress - currentProgress) * smoothing;

            if (Math.abs(targetProgress - currentProgress) < 0.00015) {
              currentProgress = targetProgress;
              isRendering = false;
              gsap.ticker.remove(renderProgress);
            }

            timeline.progress(currentProgress, false);
            modelController?.invalidate();
          };
          const updateProgress = () => {
            targetProgress = getScrollProgress();
            if (isRendering) return;

            isRendering = true;
            gsap.ticker.add(renderProgress);
          };

          timeline.progress(currentProgress, false);
          modelController?.invalidate();

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
    { dependencies: [modelController, uses3DGlasses], revertOnUpdate: true, scope: sceneRef },
  );

  return (
    <div ref={sceneRef} className="footer-scene-track relative" style={{ height: "var(--footer-scene-height, 245svh)" }}>
      <footer data-footer-scene className="sticky top-0 isolate h-svh overflow-hidden bg-[#dba666] text-white [perspective:1400px]">
        <Image
          src="/footer/footer-bg.jpg"
          alt=""
          aria-hidden="true"
          fill
          sizes="100vw"
          className="absolute inset-0 z-0 object-cover object-center"
        />
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
          {uses3DGlasses ? shouldLoad3D && <FooterGlasses3D onReady={handleModelReady} /> : <FooterGlasses />}
        </div>
      </footer>
    </div>
  );
}
