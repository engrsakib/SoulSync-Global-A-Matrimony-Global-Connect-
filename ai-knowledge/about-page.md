# Public About page (`@soulsync/web`)

Dedicated marketing route **`/about`** (public `(public)` layout: site header + footer). Home page keeps the short founder block at `/#about`; nav **About** links to `/about`.

## Section order

Hero → Goal/Mission → **Core Values** → **What We Do** → **Achievements & Milestones** → Policies → Team → Trust.

## Content

- **Seed:** [`apps/web/data/about-page.seed.json`](../apps/web/data/about-page.seed.json) — hero, goal, mission, `coreValues`, `whatWeDo`, `achievements`, policies (one `featured` for data security), founder, six team members, trust pillars, SEO.
- **Types:** [`packages/shared-types/src/about-page.ts`](../packages/shared-types/src/about-page.ts) — `AboutPageContentDto`, section DTOs (`AboutPageCoreValuesSectionDto`, etc.), `isAboutPageContentDto`.
- **Loader:** [`apps/web/lib/about-page/get-content.ts`](../apps/web/lib/about-page/get-content.ts) — `getAboutPageContent()` for RSC pages.

## Redis cache

| Key                | TTL    | Notes                                                                                           |
| ------------------ | ------ | ----------------------------------------------------------------------------------------------- |
| `about:content:v3` | 3600 s | Full JSON blob; shared client [`apps/web/lib/redis/client.ts`](../apps/web/lib/redis/client.ts) |

Read order: Redis → seed import → write-through to Redis on miss. Without `REDIS_URL`, seed is used every request (no throw). Invalid/stale blobs fail validation and reload from seed.

Future admin: persist to DB, call `setAboutPageContent()` (same key), optional CDN purge.

## API

- `GET /api/public/about-page` — same payload as SSR (Cache-Control `s-maxage=300`).

## UI components

Reusable: [`apps/web/components/public/`](../apps/web/components/public/) (`PublicSectionShell`, `PublicSectionHeader`, `PublicBokehBackground`).

About sections: [`apps/web/components/about/`](../apps/web/components/about/) — team flip uses CSS `group-hover` + `motion-safe` fallback.

**Core Values (desktop):** reusable [`ScrollStackFeatureSection`](../apps/web/components/public/scroll-stack/scroll-stack-feature-section.tsx) — FAQ-style bokeh + muted wash, GSAP `ScrollTrigger` pin + scrub, isometric stack via [`ScrollStackBlock3D`](../apps/web/components/public/scroll-stack/scroll-stack-block-3d.tsx) (top/front/side extrusion, active gradient + 2×2 icons, inactive matte + faint single icon, ghost preview). Fixed slab geometry (`BLOCK_TOP_PX` / `BLOCK_FRONT_PX` / `STACK_LAYER_STEP_PX`) in [`scroll-stack.constants.ts`](../apps/web/components/public/scroll-stack/scroll-stack.constants.ts). Layers use **active-at-top** base `bottom` via `stackLayerBaseBottom()` in [`scroll-stack-layers.tsx`](../apps/web/components/public/scroll-stack/scroll-stack-layers.tsx); GSAP `y` is peel/lift delta only; ghost icon-only above the top slot. Isometric camera `perspective(1200px)` + `rotateX(45deg) rotateZ(-25deg)`; six-tier spacing; front labels left-aligned with empty right extrusion. Front labels: active two-line, inactive truncated; Core Values `stackLabel` may shorten long titles in [`about-core-values-section.tsx`](../apps/web/components/about/about-core-values-section.tsx). Left column: section header + **large body paragraph only**. Step indicator + highlight pills from seed `items[].highlights`; client boundary in [`scroll-stack-feature-client.tsx`](../apps/web/components/public/scroll-stack/scroll-stack-feature-client.tsx). Enabled only at `lg+` without `prefers-reduced-motion`; otherwise [`scroll-stack-fallback.tsx`](../apps/web/components/public/scroll-stack/scroll-stack-fallback.tsx) card grid.

Icon mapping for values/what-we-do/milestones: [`apps/web/lib/about-page/section-icons.tsx`](../apps/web/lib/about-page/section-icons.tsx) (keyed by seed `item.id`). Scroll stack passes serializable `layerIconSet` (`about-core-values` | `about-what-we-do`) — resolved in [`scroll-stack-layer-icons.ts`](../apps/web/components/public/scroll-stack/scroll-stack-layer-icons.ts) (no function props from RSC). Dependency: `gsap` on `@soulsync/web`.

**Achievements & Milestones:** [`about-achievements-section.tsx`](../apps/web/components/about/about-achievements-section.tsx) + client [`about-achievements-roadmap.client.tsx`](../apps/web/components/about/about-achievements-roadmap.client.tsx) + zig-zag [`milestone-roadmap/`](../apps/web/components/about/milestone-roadmap/) — bokeh shell, alternating left/right cards on `md+`, dashed SVG elbow connectors, **scroll-driven illustrated rocket** (`getPointAtLength` + `getScreenCTM`, progress scoped to header+roadmap; theme vars `--roadmap-rocket-*`; `z-[8]` under milestone cards; hidden until scroll progress &gt; ~1%; static at path start when `prefers-reduced-motion`), first milestone active **theme brand gradient** (`--color-brand-*`, `--primary-foreground`), corner Lucide badges via `milestoneIcon()`. Seed `achievements.items[]` (`period`, `title`, `body`); UI sorts by `period` **newest year first** ([`milestone-roadmap-sort.ts`](../apps/web/components/about/milestone-roadmap/milestone-roadmap-sort.ts)); same Redis blob `about:content:v3`.

Team demo photos: [`apps/web/public/team/`](../apps/web/public/team/) (Unsplash; credits in seed `photoCredit`).

## Theming

Uses CSS variables and brand tokens like other marketing sections ([`themes.md`](themes.md), [`faq-section.tsx`](../apps/web/components/faq-section.tsx)).
