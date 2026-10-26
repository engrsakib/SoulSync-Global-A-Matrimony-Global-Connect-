/** Fixed slab face heights (px) — keep STACK_LAYER_STEP_PX in sync. */
export const BLOCK_TOP_PX = 72;
export const BLOCK_FRONT_PX = 34;
/** Top + front + 1px borders */
export const BLOCK_OUTER_PX = BLOCK_TOP_PX + BLOCK_FRONT_PX + 2;

/** Vertical distance between stacked layer anchors (block outer + gap). */
export const STACK_LAYER_STEP_PX = BLOCK_OUTER_PX + 8;

/** Extra lift for ghost preview above the top slab (px). */
export const STACK_GHOST_LIFT_PX = 32;

/** Isometric scene camera (match reference stack). */
export const STACK_SCENE_PERSPECTIVE_PX = 1200;
export const STACK_ISOMETRIC_TRANSFORM = 'rotateX(45deg) rotateZ(-25deg)';

/** Max inner isometric scene height (px) — fits ~6 tiers + ghost. */
export const STACK_SCENE_MAX_HEIGHT_PX = 680;

/** Compute CSS `bottom` for a layer (active slab always at top slot). */
export function stackLayerBaseBottom(
  index: number,
  activeIndex: number,
  layerCount: number,
): number {
  return (layerCount - 1 - (index - activeIndex)) * STACK_LAYER_STEP_PX;
}

/** Mobile voucher deck — collapsed peek between cards. */
export const MOBILE_DECK_PEEK_PX = 10;
/** Vertical gap when fan-expanded. */
export const MOBILE_DECK_FAN_GAP_PX = 52;
export const MOBILE_DECK_CARD_MIN_HEIGHT_PX = 120;
