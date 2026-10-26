'use client';

import { forwardRef, type MutableRefObject, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';
import { ScrollStackBlock3D } from './scroll-stack-block-3d';
import { ScrollStackStageBackground } from './scroll-stack-stage-background';
import { resolveScrollStackLayerIcon } from './scroll-stack-layer-icons';
import type { ScrollStackIconSet, ScrollStackLayer } from './scroll-stack.types';

/** Vertical offset between stacked layers (GSAP + scene). */
export const LAYER_STACK_GAP = 32;

export type ScrollStackLayerVisualProps = {
  layer: ScrollStackLayer;
  index: number;
  isActive: boolean;
  Icon?: LucideIcon;
  iconNode?: ReactNode;
};

export const ScrollStackLayerVisual = forwardRef<HTMLDivElement, ScrollStackLayerVisualProps>(
  function ScrollStackLayerVisual({ layer, index, isActive, Icon, iconNode }, ref) {
    return (
      <div
        ref={ref}
        data-layer-index={index}
        aria-hidden={!isActive}
        className={cn(
          'absolute left-1/2 w-[min(380px,94%)] will-change-transform',
          isActive ? 'z-[100]' : 'z-[1]',
        )}
        style={{ transformOrigin: 'center bottom' }}
      >
        <ScrollStackBlock3D
          layer={layer}
          isActive={isActive}
          Icon={Icon}
          iconNode={iconNode}
        />
      </div>
    );
  },
);

type ScrollStackLayersProps = {
  layers: ScrollStackLayer[];
  activeIndex: number;
  layerRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  layerIconSet?: ScrollStackIconSet;
};

export function ScrollStackLayers({
  layers,
  activeIndex,
  layerRefs,
  layerIconSet,
}: ScrollStackLayersProps) {
  const ghostLayer = layers[activeIndex + 1];
  const GhostIcon = ghostLayer
    ? resolveScrollStackLayerIcon(layerIconSet, ghostLayer.id)
    : undefined;

  return (
    <div className="relative mx-auto h-[min(520px,62vh)] w-full max-w-xl lg:h-[540px]">
      <ScrollStackStageBackground />
      <div
        className="absolute inset-0 flex items-end justify-center pb-4"
        style={{ perspective: '1600px' }}
      >
        <div
          className="relative h-[400px] w-full max-w-[400px]"
          style={{ transformStyle: 'preserve-3d', transform: 'rotateX(56deg) rotateZ(-36deg)' }}
        >
          {ghostLayer && activeIndex < layers.length - 1 ? (
            <div
              className="absolute top-0 left-1/2 z-[200] w-[min(380px,94%)] -translate-x-1/2 -translate-y-6 scale-95"
              aria-hidden
            >
              <ScrollStackBlock3D
                layer={ghostLayer}
                isActive={false}
                Icon={GhostIcon}
                ghost
              />
            </div>
          ) : null}

          {layers.map((layer, index) => {
            const Icon = resolveScrollStackLayerIcon(layerIconSet, layer.id);
            return (
              <ScrollStackLayerVisual
                key={layer.id}
                ref={(el) => {
                  layerRefs.current[index] = el;
                }}
                layer={layer}
                index={index}
                isActive={index === activeIndex}
                Icon={Icon}
              />
            );
          })}
        </div>
      </div>
      <div
        className="pointer-events-none absolute bottom-[5%] left-1/2 h-11 w-[min(340px,82%)] -translate-x-1/2 rounded-[100%] border border-[var(--border)]/40 bg-[var(--foreground)]/10 blur-2xl"
        aria-hidden
      />
    </div>
  );
}
