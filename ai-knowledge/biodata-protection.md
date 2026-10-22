# Biodata viewing protection (client + resume API)

## Client (`/biodata/[username]` — viewing another member)

- [`BioProtectionWrapper`](../apps/web/components/biodata/bio-protection-wrapper.tsx): copy/cut/paste/context menu/select/drag blocked on `.bio-protected-content`; keyboard shortcuts (F12, DevTools, view-source, save, print, copy) blocked except inside `input`/`textarea`. Composes [`BioBlurProtectionWrapper`](../apps/web/components/biodata/bio-blur-protection-wrapper.tsx) for capture blur.
- [`BioBlurProtectionWrapper`](../apps/web/components/biodata/bio-blur-protection-wrapper.tsx): applies `.bio-deterrent-obscured` when [`useCaptureDeterrent`](../apps/web/lib/use-capture-deterrent.ts) is active.
- `@media print`: biodata content hidden; “Printing is disabled” message shown.
- `NEXT_PUBLIC_BIO_PROTECTION=0` disables client hooks (local dev).
- [`BioTraceWatermark`](../apps/web/components/biodata/bio-trace-watermark.tsx): hidden by default; shown with blur when capture deterrent is active.

### Capture deterrent (explicit signals only)

Blur + watermark **only** when:

| Signal                                                                      | Notes                                                                                             |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Print Screen / macOS Cmd+Shift+3/4/5 / Win+Shift+S (if browser receives it) | Instant DOM obscure + ~8s clear ([`bio-capture-signals`](../apps/web/lib/bio-capture-signals.ts)) |
| Print (`beforeprint` + print CSS)                                           |                                                                                                   |
| Patched `getDisplayMedia`                                                   | Blur while sharing; clears after capture tracks end                                               |

**Not used (avoids “always blurred”):** tab `visibilitychange`, `window` blur, `document` mouseleave, `pagehide`, `freeze`.

**Limits:** OS snipping and mobile hardware screenshots often send no events to the page.

**Note:** Client measures are deterrent/traceability only; authorized data is enforced on the API.

## Resume API

- `GET /v1/profiles/:userId/resume` — JWT, throttled (`profileResume`: 10/min per viewer+target tracker), wraps [`getMemberViewForTargetUserId`](../apps/api/src/biodata/biodata-view.service.ts) + [`resume-field-redaction`](../apps/api/src/profiles/resume-field-redaction.ts).
- `ProfileResumeDto` = member view + `redaction.contactsApplied`. Visible `guardian_contact` returns full phones; visible `location` masks `postalCode` / `locationDetails`; locked sections omit content.
- Redis audit counter: `resume:audit:{viewerId}:{targetUserId}:{day}`.
- Web BFF: `/api/profiles/[userId]/resume`, `/api/account/viewer-trace`.
