'use client';

import type { LucideIcon } from 'lucide-react';
import { coreValueIcon, whatWeDoIcon } from '@/lib/about-page/section-icons';
import type { ScrollStackIconSet } from './scroll-stack.types';

export function resolveScrollStackLayerIcon(
  iconSet: ScrollStackIconSet | undefined,
  layerId: string,
): LucideIcon | undefined {
  if (!iconSet) {
    return undefined;
  }
  switch (iconSet) {
    case 'about-core-values':
      return coreValueIcon(layerId);
    case 'about-what-we-do':
      return whatWeDoIcon(layerId);
    default:
      return undefined;
  }
}
