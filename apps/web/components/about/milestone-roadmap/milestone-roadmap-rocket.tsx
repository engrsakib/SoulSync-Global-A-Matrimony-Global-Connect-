import { cn } from '@soulsync/ui/lib/utils';
import { forwardRef } from 'react';

type MilestoneRoadmapRocketProps = {
  className?: string;
  visible?: boolean;
};

/** Scroll-driven reference-style rocket (nose points +X; colors from roadmap CSS vars). */
export const MilestoneRoadmapRocket = forwardRef<HTMLDivElement, MilestoneRoadmapRocketProps>(
  function MilestoneRoadmapRocket({ className, visible = true }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'pointer-events-none absolute left-0 top-0 h-8 w-12 opacity-0',
          'will-change-transform drop-shadow-[0_2px_6px_color-mix(in_srgb,var(--foreground)_18%,transparent)]',
          !visible && 'opacity-0',
          className,
        )}
        aria-hidden
      >
        <svg
          viewBox="0 0 48 32"
          className="h-full w-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M46 16c-2 2-4 4-6 5-1 1-2 1-3 0-1-1-1-2 0-3 2-2 4-4 6-5 1-1 2-1 3 0 1 1 1 2 0 3z"
            fill="var(--roadmap-rocket-flame-outer)"
          />
          <path
            d="M44 16c-1.5 1.5-3 2.5-4.5 3.5-.8.5-1.5.5-2 0-.5-.5-.5-1.2 0-1.7 1.5-1.5 3-2.5 4.5-3.5.8-.5 1.5-.5 2 0 .5.5.5 1.2 0 1.7z"
            fill="var(--roadmap-rocket-flame-inner)"
          />
          <path d="M10 9h18v14H10z" fill="var(--roadmap-rocket-body)" />
          <path d="M28 8l12 8-12 8V8z" fill="var(--roadmap-rocket-nose-bottom)" />
          <path d="M28 8l12 8H28V8z" fill="var(--roadmap-rocket-nose-top)" />
          <path d="M6 10l4 2v8l-4 2V10z" fill="var(--roadmap-rocket-fin)" />
          <path d="M6 14l4 1.5v1L6 18v-4z" fill="var(--roadmap-rocket-fin)" />
          <circle cx="19" cy="16" r="3.5" fill="var(--roadmap-rocket-port-hole)" />
          <circle cx="19" cy="16" r="1.25" fill="var(--roadmap-rocket-port-glint)" />
        </svg>
      </div>
    );
  },
);
