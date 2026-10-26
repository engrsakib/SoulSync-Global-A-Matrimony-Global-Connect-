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

**Marketing cards:** Shared tokens in [`apps/web/lib/marketing-ui-classes.ts`](../apps/web/lib/marketing-ui-classes.ts) (`marketingSectionInnerClass`, surface wash, card/icon/featured classes). Card sections use [`PublicFeatureCard`](../apps/web/components/public/public-feature-card.tsx) (gradient icon tile, optional `featured` hairline) inside [`AboutSectionFrame`](../apps/web/components/about/about-section-frame.tsx) — FAQ bokeh, muted shell, left-aligned gradient `PublicSectionHeader`. Applies to Goal/Mission, What We Do, Policies, Trust, and Core Values grid via [`ScrollStackFallback`](../apps/web/components/public/scroll-stack/scroll-stack-fallback.tsx) (`omitHeader` when framed). Hero stays centered; Achievements/Team share `marketingSectionInnerClass` width.

About sections: [`apps/web/components/about/`](../apps/web/components/about/) — **Team:** [`about-team-section.tsx`](../apps/web/components/about/about-team-section.tsx) — FAQ bokeh shell, left-aligned gradient header, founder spotlight (gradient hairline, brand glow photo, quote accent), core-team grid (`sm:2` / `xl:3` stretch). [`team-member-flip-card.tsx`](../apps/web/components/about/team-member-flip-card.tsx) — 3D flip + `motion-safe` stacked fallback; optional `photoCredit` on back.

**Core Values:** [`about-core-values-section.tsx`](../apps/web/components/about/about-core-values-section.tsx) — FAQ-style bokeh shell + [`ScrollStackFallback`](../apps/web/components/public/scroll-stack/scroll-stack-fallback.tsx) only (card grid on `lg+`, mobile voucher deck below `lg`); no GSAP isometric stack on About. Reusable scroll-stack pin/scrub UI remains in [`scroll-stack-feature-section.tsx`](../apps/web/components/public/scroll-stack/scroll-stack-feature-section.tsx) for other routes if needed.

Icon mapping for values/what-we-do/milestones: [`apps/web/lib/about-page/section-icons.tsx`](../apps/web/lib/about-page/section-icons.tsx) (keyed by seed `item.id`). Scroll stack passes serializable `layerIconSet` (`about-core-values` | `about-what-we-do`) — resolved in [`scroll-stack-layer-icons.ts`](../apps/web/components/public/scroll-stack/scroll-stack-layer-icons.ts) (no function props from RSC). Dependency: `gsap` on `@soulsync/web`.

**Achievements & Milestones:** [`about-achievements-section.tsx`](../apps/web/components/about/about-achievements-section.tsx) + client [`about-achievements-roadmap.client.tsx`](../apps/web/components/about/about-achievements-roadmap.client.tsx) + zig-zag [`milestone-roadmap/`](../apps/web/components/about/milestone-roadmap/) — bokeh shell, alternating left/right cards on `md+`, dashed SVG elbow connectors, **scroll-driven illustrated rocket** (`getPointAtLength` + `getScreenCTM`, progress scoped to header+roadmap; theme vars `--roadmap-rocket-*`; `z-[8]` under milestone cards; hidden until scroll progress &gt; ~1%; static at path start when `prefers-reduced-motion`), first milestone active **theme brand gradient** (`--color-brand-*`, `--primary-foreground`); corner badge is solid `--card` tile with `--primary` Lucide icon via `milestoneIcon()` (not translucent on gradient). Seed `achievements.items[]` (`period`, `title`, `body`); UI sorts by `period` **newest year first** ([`milestone-roadmap-sort.ts`](../apps/web/components/about/milestone-roadmap/milestone-roadmap-sort.ts)); same Redis blob `about:content:v3`.

Team demo photos: [`apps/web/public/team/`](../apps/web/public/team/) (Unsplash; credits in seed `photoCredit`).

## Theming

Uses CSS variables and brand tokens like other marketing sections ([`themes.md`](themes.md), [`faq-section.tsx`](../apps/web/components/faq-section.tsx)).
