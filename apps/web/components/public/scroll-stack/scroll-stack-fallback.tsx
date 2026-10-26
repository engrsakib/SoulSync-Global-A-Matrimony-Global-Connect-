'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@soulsync/ui/card';
import { PublicSectionHeader } from '@/components/public/public-section-header';
import { resolveScrollStackLayerIcon } from './scroll-stack-layer-icons';
import type { ScrollStackFeatureProps } from './scroll-stack.types';

export function ScrollStackFallback({
  badge,
  title,
  description,
  layers,
  layerIconSet,
}: ScrollStackFeatureProps) {
  if (layers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-10">
      <PublicSectionHeader
        badge={badge}
        title={title}
        description={description}
        titleGradient
        align="left"
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {layers.map((layer) => {
          const Icon = resolveScrollStackLayerIcon(layerIconSet, layer.id);
          return (
            <li key={layer.id}>
              <Card className="h-full border-[var(--border)] bg-[var(--card)]/95 shadow-sm backdrop-blur-sm">
                <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                  {Icon ? (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-brand-600)] to-[var(--color-brand-800)] text-white shadow-sm">
                      <Icon className="h-6 w-6" aria-hidden />
                    </div>
                  ) : null}
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-lg leading-snug">{layer.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <p className="leading-relaxed text-[var(--muted-foreground)]">{layer.body}</p>
                  {layer.highlights && layer.highlights.length > 0 ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {layer.highlights.map((pill) => (
                        <li key={pill.id}>
                          <span className="inline-flex rounded-full border border-[var(--color-brand-500)]/30 bg-[var(--color-brand-500)]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-brand-700)] dark:text-[var(--color-brand-300)]">
                            {pill.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
