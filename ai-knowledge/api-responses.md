# API response envelope

Nest API responses use a shared JSON envelope from `@soulsync/shared-types` (`formatApiSuccess` / `formatApiError`). Default wire naming is **snake_case** (`status_code`, `request_id`, `next_step`).

## Success shape (snake)

```json
{
  "success": true,
  "status_code": 200,
  "message": "Success",
  "data": {},
  "meta": null,
  "next_step": null,
  "links": null,
  "request_id": "…",
  "timestamp": "…"
}
```

## Error shape (snake)

```json
{
  "success": false,
  "status_code": 400,
  "message": "Validation failed",
  "code": "VALIDATION_FAILED",
  "errors": [{ "field": "email", "message": "must be an email" }],
  "meta": null,
  "next_step": null,
  "links": null,
  "request_id": "…",
  "timestamp": "…"
}
```

## Nest wiring

- [`apps/api/src/main.ts`](../apps/api/src/main.ts) registers `TransformResponseInterceptor` and `ApiHttpExceptionFilter`.
- Correlation id: request header `x-request-id` (constant `REQUEST_ID_HEADER` in `apps/api/src/common/http`).

  | Route                         | Success body                                    | Error body              |
  | ----------------------------- | ----------------------------------------------- | ----------------------- |
  | `GET /`                       | Standard envelope; service links live in `data` | Standard error envelope |
  | `/v1/*` (API)                 | Standard envelope                               | Standard error envelope |
  | `/v1/health/**`, `/health/**` | **Raw** Terminus / liveness JSON                | Standard error envelope |

- Opt out of success wrapping per route: `@SkipResponseEnvelope()` from `apps/api/src/common/http`.
- `ApiHttpExceptionFilter` always returns the error envelope (including on health paths).

## Web BFF / clients

When calling the Nest API directly, unwrap with `unwrapApiPayload()` and read errors with `readApiErrorMessage()` from `@soulsync/shared-types`. See [`apps/web/lib/api-auth-proxy.ts`](../apps/web/lib/api-auth-proxy.ts) and [`apps/web/lib/api.ts`](../apps/web/lib/api.ts).

For `GET /`, read `data.service`, `data.documentation`, and similar fields inside the envelope. Health **success** responses stay unwrapped for Terminus; failed health checks still use the standard error envelope.
