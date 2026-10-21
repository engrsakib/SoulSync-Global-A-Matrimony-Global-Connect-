# OpenAPI (Swagger)

Interactive docs: **`http://localhost:<API_PORT>/docs`** (OpenAPI JSON at `/docs-json`).

## Setup

- Bootstrap: [`apps/api/src/swagger/setup-swagger.ts`](../apps/api/src/swagger/setup-swagger.ts) (JWT bearer, tags, envelope description).
- Shared decorators and response DTOs: [`apps/api/src/common/swagger/`](../apps/api/src/common/swagger/).

## Request body schemas

Every `@Body()` DTO must declare **`@ApiProperty`** / **`@ApiPropertyOptional`** on each field (required vs optional, examples, descriptions). The Nest CLI plugin can supplement this, but explicit decorators are the source of truth so `/docs` never shows an empty `{}`.

On controllers, use **`@ApiJsonBody(YourDto)`** from `common/swagger` alongside `@ApiOperation`.

[`apps/api/nest-cli.json`](../apps/api/nest-cli.json) also enables the `@nestjs/swagger` plugin on `*.dto.ts` for class-validator shims when you rebuild.

## Response documentation

| Route area                      | Success body in docs                                                                                                                          |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `/v1/*` (except health success) | Standard envelope (snake_case metadata) + typed `data` via `ApiWrappedOkResponse` / `ApiWrappedCreatedResponse` / `ApiWrappedOkArrayResponse` |
| `/v1/health/**` success         | Raw Terminus or `{ status: "ok" }` — documented explicitly                                                                                    |
| Errors                          | `ApiErrorEnvelopeDto` via `@ApiCommonErrors()`                                                                                                |

Payload inside `data` uses the same property names the controller returns (typically camelCase).

## Checklist for new routes

1. Request body: `something.dto.ts` with `class-validator` (+ JSDoc on fields).
2. `@ApiOperation({ summary, description? })`.
3. `@ApiWrappedOkResponse(YourResponseDto)` (or Created / Array variant).
4. `@ApiCommonErrors()` on routes that can fail with standard HTTP errors.
5. JWT routes: `@ApiBearerAuth('jwt')` and tag `account` / `email` as appropriate.
6. Query params: `@ApiQuery` when not obvious from the path.

See [api-responses.md](./api-responses.md) for runtime envelope behavior.
