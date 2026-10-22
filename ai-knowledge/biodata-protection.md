# Biodata viewing protection (client + resume API)

## Client (`/biodata/[username]` — viewing another member)

- [`BioProtectionWrapper`](../apps/web/components/biodata/bio-protection-wrapper.tsx): copy/cut/paste/context menu/select/drag blocked on `.bio-protected-content`; keyboard shortcuts (F12, DevTools, view-source, save, print, copy) blocked except inside `input`/`textarea`.
- `@media print`: biodata content hidden; “Printing is disabled” message shown.
- DevTools heuristic: large `outerWidth - innerWidth` → same deterrent state (blur + watermark) as capture signals.
- `NEXT_PUBLIC_BIO_PROTECTION=0` disables client hooks (local dev).
- [`BioTraceWatermark`](../apps/web/components/biodata/bio-trace-watermark.tsx): repeating SVG trace text (viewer id short, **server-masked IP**, server timestamp). **Hidden by default** (`opacity: 0`); shown with content blur when [`useCaptureDeterrent`](../apps/web/lib/use-capture-deterrent.ts) fires (Print Screen, tab hidden / return delay, print) or DevTools heuristic is active.

**Note:** Client measures are deterrent/traceability only; authorized data is enforced on the API.

## Resume API

- `GET /v1/profiles/:userId/resume` — JWT, throttled (`profileResume`: 10/min per viewer+target tracker), wraps [`getMemberViewForTargetUserId`](../apps/api/src/biodata/biodata-view.service.ts) + [`resume-field-redaction`](../apps/api/src/profiles/resume-field-redaction.ts).
- `ProfileResumeDto` = member view + `redaction.contactsApplied`. Visible `guardian_contact` returns full phones; visible `location` masks `postalCode` / `locationDetails`; locked sections omit content.
- Redis audit counter: `resume:audit:{viewerId}:{targetUserId}:{day}`.
- Web BFF: `/api/profiles/[userId]/resume`, `/api/account/viewer-trace`.
