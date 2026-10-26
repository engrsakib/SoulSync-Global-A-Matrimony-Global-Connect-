'use client';

import { useCallback, useMemo, useState } from 'react';
import { cn } from '@soulsync/ui/lib/utils';
import {
  MOBILE_DECK_CARD_MIN_HEIGHT_PX,
  MOBILE_DECK_FAN_GAP_PX,
  MOBILE_DECK_PEEK_PX,
} from './scroll-stack.constants';
import { SCROLL_STACK_HIGHLIGHT_TONE_CLASS } from './scroll-stack-highlight-styles';
import { resolveScrollStackLayerIcon } from './scroll-stack-layer-icons';
import { ScrollStackStepIndicator } from './scroll-stack-step-indicator';
import { STACK_THEME_CSS_PROPERTIES } from './scroll-stack-theme-vars';
import type { ScrollStackIconSet, ScrollStackLayer } from './scroll-stack.types';

type ScrollStackMobileDeckProps = {
  layers: ScrollStackLayer[];
  layerIconSet?: ScrollStackIconSet;
};

function visualStackOrder(activeIndex: number, count: number): number[] {
  const order: number[] = [activeIndex];
  for (let offset = 1; offset < count; offset += 1) {
    order.push((activeIndex + offset) % count);
  }
  return order;
}

function inactiveCardBackground(depth: number): string {
  const mix = Math.min(42, 12 + depth * 6);
  return `linear-gradient(135deg, color-mix(in oklch, var(--color-brand-600) ${mix}%, var(--card)), color-mix(in oklch, var(--color-brand-800) ${mix + 8}%, var(--muted)))`;
}

function activeCardBackground(): string {
  return `linear-gradient(135deg, var(--stack-active-top-from), var(--stack-active-top-via) 48%, var(--stack-active-top-to))`;
}

export function ScrollStackMobileDeck({ layers, layerIconSet }: ScrollStackMobileDeckProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const stackOrder = useMemo(
    () => visualStackOrder(activeIndex, layers.length),
    [activeIndex, layers.length],
  );

  const collapsedHeight =
    MOBILE_DECK_CARD_MIN_HEIGHT_PX + (layers.length - 1) * MOBILE_DECK_PEEK_PX;
  const expandedHeight =
    MOBILE_DECK_CARD_MIN_HEIGHT_PX + (layers.length - 1) * MOBILE_DECK_FAN_GAP_PX;

  const handleCardTap = useCallback(
    (layerIndex: number, visualPos: number) => {
      if (expanded && layerIndex === activeIndex && visualPos === 0) {
        setExpanded(false);
        return;
      }
      setActiveIndex(layerIndex);
      setExpanded(true);
    },
    [activeIndex, expanded],
  );

  const activeLayer = layers[activeIndex] ?? layers[0];
  if (!activeLayer) {
    return null;
  }

  return (
    <div className="space-y-8" style={STACK_THEME_CSS_PROPERTIES}>
      <div className="relative mx-auto w-full max-w-md">
        <div
          className="relative w-full motion-reduce:transition-none motion-safe:transition-[height] motion-safe:duration-300"
          style={{ height: expanded ? expandedHeight : collapsedHeight }}
        >
          {stackOrder.map((layerIndex, visualPos) => {
            const layer = layers[layerIndex]!;
            const Icon = resolveScrollStackLayerIcon(layerIconSet, layer.id);
            const isFront = visualPos === 0;
            const offsetY = expanded
              ? -visualPos * MOBILE_DECK_FAN_GAP_PX
              : -visualPos * MOBILE_DECK_PEEK_PX;
            const zIndex = layers.length - visualPos;

            return (
              <button
                key={layer.id}
                type="button"
                aria-label={`${layer.title}${isFront ? ', selected' : ''}`}
                aria-pressed={layerIndex === activeIndex}
                onClick={() => handleCardTap(layerIndex, visualPos)}
                className={cn(
                  'absolute inset-x-0 bottom-0 overflow-hidden rounded-2xl border text-left shadow-lg',
                  'border-[var(--stack-active-border)]/25',
                  'motion-reduce:transition-none motion-safe:transition-transform motion-safe:duration-300',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2',
                )}
                style={{
                  minHeight: MOBILE_DECK_CARD_MIN_HEIGHT_PX,
                  transform: `translateY(${offsetY}px)`,
                  zIndex,
                  background: isFront ? activeCardBackground() : inactiveCardBackground(visualPos),
                  boxShadow: isFront
                    ? `0 18px 40px -12px var(--stack-active-shadow)`
                    : `0 8px 24px -8px var(--stack-shadow)`,
                }}
              >
                <span
                  className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-black/10 blur-xl"
                  aria-hidden
                />

                <div className="relative flex h-full min-h-[120px] flex-col justify-between p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      {isFront || expanded ? (
                        <>
                          <p className="text-xs font-semibold uppercase tracking-wide text-white/75">
                            {layer.stackLabel}
                          </p>
                          <p className="text-lg font-bold leading-tight text-white">{layer.title}</p>
                        </>
                      ) : (
                        <p className="truncate text-sm font-semibold text-white/90">{layer.title}</p>
                      )}
                    </div>
                    {Icon ? (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--stack-active-glass-bg)] ring-1 ring-[var(--stack-active-glass-ring)]">
                        <Icon className="h-5 w-5 text-[var(--stack-active-icon)]" aria-hidden />
                      </div>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {expanded && layers.length > 1 ? (
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="mt-3 text-sm font-semibold text-[var(--color-brand-600)] dark:text-[var(--color-brand-400)]"
          >
            Collapse stack
          </button>
        ) : null}
      </div>

      <div
        key={activeLayer.id}
        className={cn(
          'space-y-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200',
          'motion-reduce:animate-none',
        )}
        aria-live="polite"
      >
        <h3 className="text-xl font-semibold text-[var(--foreground)]">{activeLayer.title}</h3>
        <p className="leading-relaxed text-[var(--muted-foreground)]">{activeLayer.body}</p>
        {activeLayer.highlights && activeLayer.highlights.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {activeLayer.highlights.map((pill) => (
              <li key={pill.id}>
                <span
                  className={cn(
                    'inline-flex rounded-full border px-3 py-1 text-xs font-semibold',
                    SCROLL_STACK_HIGHLIGHT_TONE_CLASS[pill.tone ?? 'brand'],
                  )}
                >
                  {pill.label}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <ScrollStackStepIndicator
        activeIndex={activeIndex}
        total={layers.length}
        onStepSelect={(index) => {
          setActiveIndex(index);
          setExpanded(true);
        }}
      />
    </div>
  );
}
