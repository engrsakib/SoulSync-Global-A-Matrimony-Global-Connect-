'use client';

import type { AboutPageMilestoneItemDto } from '@soulsync/shared-types/about-page';
import { cn } from '@soulsync/ui/lib/utils';
import { useCallback, useEffect, useMemo, useRef, type CSSProperties, type RefObject } from 'react';
import { milestoneIcon } from '@/lib/about-page/section-icons';
import { MilestoneRoadmapCard } from './milestone-roadmap-card';
import {
  MilestoneRoadmapConnector,
  MilestoneRoadmapMobileSpine,
} from './milestone-roadmap-connector';
import { MilestoneRoadmapRocket } from './milestone-roadmap-rocket';
import { pointOnRoadmapPaths, roadmapScrollProgress } from './milestone-roadmap-scroll';
import { sortMilestonesNewestFirst } from './milestone-roadmap-sort';

type MilestoneRoadmapProps = {
  items: AboutPageMilestoneItemDto[];
  /** Scroll progress is computed from this element (e.g. achievements header + roadmap). */
  scrollScopeRef?: RefObject<HTMLElement | null>;
};

const REDUCE_MOTION_MEDIA = '(prefers-reduced-motion: reduce)';

const ROCKET_THEME_VARS: CSSProperties = {
  ['--roadmap-rocket-nose-top' as string]:
    'color-mix(in oklch, var(--color-brand-600) 55%, var(--primary))',
  ['--roadmap-rocket-nose-bottom' as string]: 'var(--color-brand-700)',
  ['--roadmap-rocket-body' as string]:
    'color-mix(in oklch, var(--card) 88%, var(--primary-foreground))',
  ['--roadmap-rocket-port-hole' as string]: 'var(--color-brand-800)',
  ['--roadmap-rocket-port-glint' as string]: 'var(--color-brand-100)',
  ['--roadmap-rocket-fin' as string]: 'var(--color-brand-800)',
  ['--roadmap-rocket-flame-outer' as string]:
    'color-mix(in oklch, var(--color-brand-500) 35%, oklch(0.72 0.17 55))',
  ['--roadmap-rocket-flame-inner' as string]:
    'color-mix(in oklch, var(--color-brand-100) 25%, oklch(0.88 0.14 85))',
};

export function MilestoneRoadmap({ items, scrollScopeRef }: MilestoneRoadmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rocketRef = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const reduceMotionRef = useRef(false);

  const paintRocket = useCallback(() => {
    const container = containerRef.current;
    const rocket = rocketRef.current;
    if (!container || !rocket) {
      return;
    }

    const scope = scrollScopeRef?.current ?? container;
    const progress = reduceMotionRef.current ? 0 : roadmapScrollProgress(scope);
    const point = pointOnRoadmapPaths(pathRefs.current, progress, container);
    const minProgress = 0.012;
    if (!point || (!reduceMotionRef.current && progress < minProgress)) {
      rocket.style.opacity = '0';
      return;
    }

    rocket.style.opacity = '1';
    rocket.style.left = `${point.x}px`;
    rocket.style.top = `${point.y}px`;
    rocket.style.transform = `translate(-50%, -50%) rotate(${point.angleDeg}deg)`;
  }, [scrollScopeRef]);

  const schedulePaint = useCallback(() => {
    if (rafRef.current !== null) {
      return;
    }
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      paintRocket();
    });
  }, [paintRocket]);

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia(REDUCE_MOTION_MEDIA).matches;
    const mq = window.matchMedia(REDUCE_MOTION_MEDIA);
    const onMotionChange = () => {
      reduceMotionRef.current = mq.matches;
      schedulePaint();
    };
    mq.addEventListener('change', onMotionChange);

    schedulePaint();
    window.addEventListener('scroll', schedulePaint, { passive: true });
    window.addEventListener('resize', schedulePaint);

    const container = containerRef.current;
    const scopeEl = scrollScopeRef?.current;
    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(schedulePaint);
      if (container) {
        resizeObserver.observe(container);
      }
      if (scopeEl && scopeEl !== container) {
        resizeObserver.observe(scopeEl);
      }
    }

    return () => {
      mq.removeEventListener('change', onMotionChange);
      window.removeEventListener('scroll', schedulePaint);
      window.removeEventListener('resize', schedulePaint);
      resizeObserver?.disconnect();
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [schedulePaint, scrollScopeRef]);

  const orderedItems = useMemo(() => sortMilestonesNewestFirst(items), [items]);

  if (orderedItems.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-4xl px-1 sm:px-2"
      style={ROCKET_THEME_VARS}
    >
      <MilestoneRoadmapMobileSpine />

      <ol className="relative space-y-0 md:space-y-0">
        {orderedItems.map((item, index) => {
          const isLeft = index % 2 === 0;
          const isActive = index === 0;
          const Icon = milestoneIcon(item.id);

          return (
            <li key={item.id} className="relative list-none">
              <div
                className={cn(
                  'relative z-10 flex pl-10 md:pl-0',
                  isLeft ? 'md:justify-start' : 'md:justify-end',
                )}
              >
                <div className="w-full md:w-[min(100%,420px)] md:max-w-[55%]">
                  <MilestoneRoadmapCard item={item} isActive={isActive} Icon={Icon} />
                </div>
              </div>

              {index < orderedItems.length - 1 ? (
                <MilestoneRoadmapConnector
                  fromLeft={isLeft}
                  pathRef={(element) => {
                    pathRefs.current[index] = element;
                    schedulePaint();
                  }}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div
        className="pointer-events-none absolute inset-0 z-[8] hidden overflow-hidden md:block"
        aria-hidden
      >
        <MilestoneRoadmapRocket ref={rocketRef} />
      </div>
    </div>
  );
}
