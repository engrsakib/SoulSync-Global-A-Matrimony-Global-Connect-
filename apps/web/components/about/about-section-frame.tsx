import type { ReactNode } from 'react';
import { cn } from '@soulsync/ui/lib/utils';
import { PublicBokehBackground } from '@/components/public/public-bokeh-background';
import { PublicSectionHeader } from '@/components/public/public-section-header';
import { PublicSectionShell } from '@/components/public/public-section-shell';
import {
  marketingSectionInnerClass,
  marketingSectionSurfaceClass,
} from '@/lib/marketing-ui-classes';

type AboutSectionFrameProps = {
  badge: string;
  title: string;
  description?: string;
  children: ReactNode;
  borderTop?: boolean;
  shellClassName?: string;
};

export function AboutSectionFrame({
  badge,
  title,
  description,
  children,
  borderTop = true,
  shellClassName,
}: AboutSectionFrameProps) {
  return (
    <PublicSectionShell
      borderTop={borderTop}
      className={cn(marketingSectionSurfaceClass, shellClassName)}
      background={<PublicBokehBackground variant="faq" />}
      innerClassName={marketingSectionInnerClass}
    >
      <div className="space-y-10 md:space-y-14">
        <PublicSectionHeader
          badge={badge}
          title={title}
          description={description}
          titleGradient
          align="left"
        />
        {children}
      </div>
    </PublicSectionShell>
  );
}
