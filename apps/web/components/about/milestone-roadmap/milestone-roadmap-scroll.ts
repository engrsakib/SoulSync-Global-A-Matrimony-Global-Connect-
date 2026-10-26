export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

const SCROLL_START_VIEWPORT = 0.8;
const SCROLL_END_VIEWPORT = 0.22;

/** 0 when scope enters the lower viewport; 1 when it exits the upper viewport. */
export function roadmapScrollProgress(scope: HTMLElement): number {
  const rect = scope.getBoundingClientRect();
  const vh = window.innerHeight;
  const startLine = vh * SCROLL_START_VIEWPORT;
  const endLine = vh * SCROLL_END_VIEWPORT;
  const traveled = startLine - rect.top;
  const range = rect.height + (startLine - endLine);
  if (range <= 0) {
    return 0;
  }
  return clamp01(traveled / range);
}

export type RoadmapRocketPoint = {
  x: number;
  y: number;
  angleDeg: number;
};

const TANGENT_SAMPLE_PX = 8;

function pathPointToContainerLocal(
  path: SVGPathElement,
  atLength: number,
  container: HTMLElement,
): { x: number; y: number } | null {
  const ctm = path.getScreenCTM();
  if (!ctm) {
    return null;
  }
  const pt = path.getPointAtLength(atLength);
  const screen = new DOMPoint(pt.x, pt.y).matrixTransform(ctm);
  const containerRect = container.getBoundingClientRect();
  return {
    x: screen.x - containerRect.left,
    y: screen.y - containerRect.top,
  };
}

export function pointOnRoadmapPaths(
  paths: ReadonlyArray<SVGPathElement | null>,
  progress: number,
  container: HTMLElement,
): RoadmapRocketPoint | null {
  const activePaths = paths.filter((path): path is SVGPathElement => path !== null);
  if (activePaths.length === 0) {
    return null;
  }

  const lengths = activePaths.map((path) => path.getTotalLength());
  const totalLength = lengths.reduce((sum, len) => sum + len, 0);
  if (totalLength <= 0) {
    return null;
  }

  let remaining = clamp01(progress) * totalLength;
  let segmentIndex = 0;
  while (segmentIndex < lengths.length) {
    const segmentLen = lengths[segmentIndex];
    if (segmentLen === undefined || remaining <= segmentLen) {
      break;
    }
    remaining -= segmentLen;
    segmentIndex += 1;
  }
  if (segmentIndex >= activePaths.length) {
    segmentIndex = activePaths.length - 1;
    remaining = lengths[segmentIndex] ?? 0;
  }

  const path = activePaths[segmentIndex]!;
  const segmentLength = lengths[segmentIndex] ?? 0;
  const atLength = Math.min(Math.max(remaining, 0), segmentLength);
  const aheadLength = Math.min(atLength + TANGENT_SAMPLE_PX, segmentLength);

  const point = pathPointToContainerLocal(path, atLength, container);
  const ahead = pathPointToContainerLocal(path, aheadLength, container);
  if (!point || !ahead) {
    return null;
  }

  const angleDeg = (Math.atan2(ahead.y - point.y, ahead.x - point.x) * 180) / Math.PI;

  return { x: point.x, y: point.y, angleDeg };
}
