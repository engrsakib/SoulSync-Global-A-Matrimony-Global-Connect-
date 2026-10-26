'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollStackContentPanel } from './scroll-stack-content-panel';
import { ScrollStackFallback } from './scroll-stack-fallback';
import { LAYER_STACK_GAP, ScrollStackLayers } from './scroll-stack-layers';
import type { ScrollStackFeatureProps } from './scroll-stack.types';

const SCROLL_STEP_VH = 0.85;
const LG_MEDIA = '(min-width: 1024px)';
const REDUCE_MOTION_MEDIA = '(prefers-reduced-motion: reduce)';

function applyStackTransforms(
  layerElements: (HTMLDivElement | null)[],
  progress: number,
  layerCount: number,
): number {
  const scaled = progress * layerCount;
  const activeIdx = Math.min(layerCount - 1, Math.max(0, Math.floor(scaled)));
  const local = scaled - activeIdx;

  layerElements.forEach((el, i) => {
    if (!el) {
      return;
    }

    let y: number;
    let opacity: number;
    let scale: number;
    let zIndex: number;
    let rotateX: number;

    if (i < activeIdx) {
      y = -150 - (activeIdx - i) * 40;
      opacity = 0.1;
      scale = 0.9;
      zIndex = i;
      rotateX = 0;
    } else if (i === activeIdx) {
      const lift = Math.min(1, local * 1.15);
      y = -100 * lift;
      opacity = 1;
      scale = 1 + 0.08 * lift;
      zIndex = 100;
      rotateX = -4 + 4 * lift;
    } else {
      y = (i - activeIdx) * LAYER_STACK_GAP;
      opacity = Math.max(0.55, 0.98 - (i - activeIdx) * 0.08);
      scale = Math.max(0.88, 1 - (i - activeIdx) * 0.028);
      zIndex = layerCount - i;
      rotateX = 0;
    }

    gsap.set(el, {
      y,
      opacity,
      scale,
      rotateX,
      zIndex,
      xPercent: -50,
      force3D: true,
      transformPerspective: 900,
    });
  });

  return activeIdx;
}

export function ScrollStackFeatureClient(props: ScrollStackFeatureProps) {
  const { badge, title, description, layers, layerIconSet } = props;

  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollEnabled, setScrollEnabled] = useState(false);

  useLayoutEffect(() => {
    const lg = window.matchMedia(LG_MEDIA);
    const reduce = window.matchMedia(REDUCE_MOTION_MEDIA);
    const evaluate = () => setScrollEnabled(lg.matches && !reduce.matches);
    evaluate();
    lg.addEventListener('change', evaluate);
    reduce.addEventListener('change', evaluate);
    return () => {
      lg.removeEventListener('change', evaluate);
      reduce.removeEventListener('change', evaluate);
    };
  }, []);

  useLayoutEffect(() => {
    if (!scrollEnabled || layers.length === 0) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const scrollWrapper = scrollWrapperRef.current;
    const pinEl = pinRef.current;
    if (!scrollWrapper || !pinEl) {
      return;
    }

    const layerCount = layers.length;
    const scrollDistance = () => layerCount * window.innerHeight * SCROLL_STEP_VH;

    const ctx = gsap.context(() => {
      const update = (progress: number) => {
        const idx = applyStackTransforms(layerRefs.current, progress, layerCount);
        setActiveIndex(idx);
      };

      update(0);

      const trigger = ScrollTrigger.create({
        trigger: scrollWrapper,
        start: 'top top',
        end: () => `+=${scrollDistance()}`,
        pin: pinEl,
        pinSpacing: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => update(self.progress),
      });
      scrollTriggerRef.current = trigger;
    }, scrollWrapper);

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      scrollTriggerRef.current = null;
      ctx.revert();
    };
  }, [scrollEnabled, layers]);

  const scrollToStep = useCallback(
    (index: number) => {
      const st = scrollTriggerRef.current;
      if (!st || layers.length === 0) {
        return;
      }
      const clamped = Math.min(layers.length - 1, Math.max(0, index));
      const progress = (clamped + 0.001) / layers.length;
      const y = st.start + progress * (st.end - st.start);
      window.scrollTo({ top: y, behavior: 'smooth' });
    },
    [layers.length],
  );

  if (layers.length === 0) {
    return null;
  }

  if (!scrollEnabled) {
    return <ScrollStackFallback {...props} />;
  }

  const activeLayer = layers[activeIndex] ?? layers[0]!;

  return (
    <div
      ref={scrollWrapperRef}
      className="relative"
      style={{ height: `${layers.length * SCROLL_STEP_VH * 100}vh` }}
    >
      <div ref={pinRef} className="flex min-h-[100dvh] items-center py-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <ScrollStackContentPanel
            badge={badge}
            sectionTitle={title}
            sectionDescription={description}
            layer={activeLayer}
            activeIndex={activeIndex}
            totalLayers={layers.length}
            onStepSelect={scrollToStep}
          />
          <ScrollStackLayers
            layers={layers}
            activeIndex={activeIndex}
            layerRefs={layerRefs}
            layerIconSet={layerIconSet}
          />
        </div>
      </div>
    </div>
  );
}
