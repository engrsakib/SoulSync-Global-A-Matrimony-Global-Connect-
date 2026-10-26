'use client';

import { forwardRef, type MutableRefObject, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@soulsync/ui/lib/utils';
import { ScrollStackBlock3D } from './scroll-stack-block-3d';
import {
  BLOCK_OUTER_PX,
  STACK_GHOST_LIFT_PX,
  STACK_ISOMETRIC_TRANSFORM,
  STACK_LAYER_STEP_PX,
  STACK_SCENE_MAX_HEIGHT_PX,
  STACK_SCENE_PERSPECTIVE_PX,
  stackLayerBaseBottom,
} from './scroll-stack.constants';
import { ScrollStackStageBackground } from './scroll-stack-stage-background';
import { resolveScrollStackLayerIcon } from './scroll-stack-layer-icons';
import type { ScrollStackIconSet, ScrollStackLayer } from './scroll-stack.types';

/** @deprecated Use STACK_LAYER_STEP_PX from scroll-stack.constants */
export const LAYER_STACK_GAP = STACK_LAYER_STEP_PX;

function sceneInnerHeight(layerCount: number): number {
  const tiers = Math.min(6, Math.max(1, layerCount));
  const raw = tiers * STACK_LAYER_STEP_PX + BLOCK_OUTER_PX + STACK_GHOST_LIFT_PX + 40;
  return Math.min(Math.max(380, raw), STACK_SCENE_MAX_HEIGHT_PX);
}

export type ScrollStackLayerVisualProps = {
  layer: ScrollStackLayer;
  index: number;
  activeIndex: number;
  layerCount: number;
  isActive: boolean;
  Icon?: LucideIcon;
  iconNode?: ReactNode;
};

export const ScrollStackLayerVisual = forwardRef<HTMLDivElement, ScrollStackLayerVisualProps>(
  function ScrollStackLayerVisual(
    { layer, index, activeIndex, layerCount, isActive, Icon, iconNode },
    ref,
  ) {
    const baseBottom = stackLayerBaseBottom(index, activeIndex, layerCount);
    const tierFromTop = Math.max(0, index - activeIndex);

    return (
      <div
        ref={ref}
        data-layer-index={index}
        aria-hidden={!isActive}
        className={cn(
          'absolute left-1/2 w-[min(360px,92%)] will-change-transform',
          isActive ? 'z-[100]' : 'z-[1]',
        )}
        style={{
          bottom: baseBottom,
          transformOrigin: 'center bottom',
        }}
      >
        <ScrollStackBlock3D
          layer={layer}
          isActive={isActive}
          Icon={Icon}
          iconNode={iconNode}
          tierFromTop={tierFromTop}
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
  const layerCount = layers.length;
  const ghostLayer = layers[activeIndex + 1];
  const GhostIcon = ghostLayer
    ? resolveScrollStackLayerIcon(layerIconSet, ghostLayer.id)
    : undefined;

  const innerH = sceneInnerHeight(layerCount);
  const showGhost = ghostLayer && activeIndex < layerCount - 1;
  const ghostBottom = layerCount * STACK_LAYER_STEP_PX + STACK_GHOST_LIFT_PX;
  const stageMinHeight = innerH + BLOCK_OUTER_PX + 64;

  return (
    <div
      className="relative mx-auto w-full max-w-xl"
      style={{ height: `min(${stageMinHeight}px, 70vh)` }}
    >
      <ScrollStackStageBackground />
      <div
        className="absolute inset-0 flex items-end justify-center overflow-hidden pb-2 sm:pb-4"
        style={{ perspective: `${STACK_SCENE_PERSPECTIVE_PX}px` }}
      >
        <div
          className="relative mx-auto w-full max-w-[400px] transform-gpu overflow-visible"
          style={{
            height: innerH,
            transformStyle: 'preserve-3d',
            transform: STACK_ISOMETRIC_TRANSFORM,
          }}
        >
          {showGhost ? (
            <div
              className="absolute left-1/2 z-[200] w-[min(360px,92%)] -translate-x-1/2"
              style={{ bottom: ghostBottom }}
              aria-hidden
            >
              <ScrollStackBlock3D layer={ghostLayer} isActive={false} Icon={GhostIcon} ghost />
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
                activeIndex={activeIndex}
                layerCount={layerCount}
                isActive={index === activeIndex}
                Icon={Icon}
              />
            );
          })}
        </div>
      </div>
      <div
        className="pointer-events-none absolute bottom-[4%] left-1/2 h-11 w-[min(320px,78%)] -translate-x-1/2 rounded-[100%] border border-[var(--border)]/40 bg-[var(--foreground)]/10 blur-2xl"
        aria-hidden
      />
    </div>
  );
}
