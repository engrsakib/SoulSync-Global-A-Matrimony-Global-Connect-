import { cn } from '@soulsync/ui/lib/utils';

type MilestoneRoadmapConnectorProps = {
  /** Previous card was on the left column. */
  fromLeft: boolean;
  pathRef?: (element: SVGPathElement | null) => void;
};

/** Smoother elbow at vertical→horizontal bend (same anchor endpoints as prior polyline). */
const PATH_FROM_LEFT = 'M 320 8 H 560 V 64 Q 560 72 552 72 H 480';
const PATH_FROM_RIGHT = 'M 480 8 H 240 V 64 Q 240 72 248 72 H 320';

export function MilestoneRoadmapConnector({
  fromLeft,
  pathRef,
}: MilestoneRoadmapConnectorProps) {
  return (
    <div
      className={cn(
        'relative mx-auto hidden h-16 w-full max-w-4xl md:block md:h-20 lg:h-24',
      )}
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 800 96"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          ref={pathRef}
          d={fromLeft ? PATH_FROM_LEFT : PATH_FROM_RIGHT}
          stroke="var(--border)"
          strokeWidth="2.5"
          strokeDasharray="10 8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** Mobile: vertical dashed guide between stacked cards. */
export function MilestoneRoadmapMobileSpine() {
  return (
    <div
      className="absolute top-0 bottom-0 left-5 w-px border-l border-dashed border-[var(--border)] md:hidden"
      aria-hidden
    />
  );
}
