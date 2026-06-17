# NestJS Framework Template — Review & Extraction Notes

> Source: https://github.com/maxgaurav/nestjs-framework-template  
> Sequelize/DB layer intentionally excluded from this review.

---

## 1. Cluster & Worker Management

The most unique thing in this repo. A full Node.js clustering system:

- Forks one worker per CPU core (configurable max)
- RxJS-based **health monitoring** — polls workers at intervals, tracks pass/fail rates (80% threshold), kills and restarts unhealthy workers
- IPC between master and workers via `ProcessMessagingService` with EventEmitter2
- If a worker exhausts its restart attempts, the master process exits cleanly

**Key files:** `src/cluster/services/setup-cluster/`, `src/common/services/process-messaging/`

**Config:** cluster enable flag, max CPU count, max restart attempts, health check intervals/threshold

---

## 2. Full OAuth2 Authorization Server

Not just a client — this app **is** the OAuth server. Three grant type flows:

- **Implicit password** — direct username/password → token
- **PKCE** — for mobile/public clients, code challenge verification
- **Authorization Code** — full redirect-based flow with login screens

Complete with:
- Access tokens + refresh tokens
- JWT key management — RSA public/private keys loaded from `storage/` at boot
- OAuth client management via CLI
- Guards per flow: `AccessTokenGuard`, `LoginAccessTokenGuard`, `RefreshAccessTokenGuard`, `AuthorizationGuard`, `WebGuard`

**Key files:** `src/auth/`

---

## 3. Session Management System

Multi-driver session layer:

- File-based and in-memory session stores
- **Flash messaging** for validation errors
- **Old input preservation** — re-populates forms after failed validation
- **Intent manager** — saves intended URL before login redirect, restores after
- `KillForApiInterceptor` — disables sessions for `application/json` requests

**Key files:** `src/session-manager/`

---

## 4. Error Validation Format Filter

Global filter handling `UnprocessableEntityException`:

- JSON requests → returns structured error object
- HTML/form requests → stores errors in flash, redirects back to referrer
- Recursively formats nested validation errors

**Key files:** `src/helpers/filters/error-validation-format.filter.ts`

---

## 5. Twig View Engine with Custom Template Functions

Full server-side rendering with Twig, plus custom registered functions:

- `url()` — generates absolute URLs with path/query params
- `query()` — accesses query params in templates
- `session()` — reads session data in templates
- `pathParam()` — reads route params in templates

**Key files:** `src/view-engine/`

---

## 6. CLI Commands via `nestjs-command`

Separate `cli.ts` entrypoint for admin tasks:

- `route:list` — lists all registered routes
- `oauth:generate-client` — creates OAuth client credentials
- `oauth:generate-keys` — generates JWT RSA key pair

**Key files:** `src/cli.ts`, `src/cli-commands/`

---

## 7. Request Context + Logging

- **nestjs-cls** for request-scoped storage — assigns a UUID to every request, attaches to all logs
- Custom `LoggingService` extends NestJS `ConsoleLogger`, prefixes every log with `[TYPE-UUID]`
- `@LoggingDecorator` method decorator — auto-logs before/after execution, handles sync and async

**Key files:** `src/services/logging/logging.service.ts`, `src/common/decorators/logging.decorator.ts`, `src/common/application-context.ts`

---

## 8. Mail Service with Template Rendering

- Two drivers: **SMTP** (production) and **log/stdout** (development)
- Renders `.twig` email templates on-the-fly
- Configurable from/name, inline CSS support

**Key files:** `src/mail/`

---

## 9. Event Callback System (Post-Transaction Hooks)

`EventRegisterCallbackService` — registers callbacks to fire after a transaction commits. Falls back to synchronous execution if no active transaction.

Correct pattern for side effects (e.g. sending email after a DB write). Can be adapted for Prisma's `$transaction`.

**Key files:** `src/common/services/event-register-callback/`

---

## 10. URL Builder Service

`UrlBuilderService` — generates absolute URLs from paths with:
- Path parameter substitution (`:id` → actual value)
- Query string appending with array support
- Based on `APP_URL` env config

Useful for mailer links, OAuth redirects, etc.

**Key files:** `src/url-management/`

---

## 11. Bootstrap & Security Defaults

Production-ready `main.ts` checklist:

- **Helmet** for security headers
- **CORS** with explicit allowed origins
- **API versioning** — URI-based (`/api/v1/...`)
- **Global ValidationPipe** with `whitelist: true`, `transform: true`
- **Swagger** at `/api-documentation/v1`
- Ordered global interceptors: `NotFoundConverterInterceptor` → `SessionMapPreviousUrlInterceptor` → `SetupIntendInterceptor` → `KillForApiInterceptor` → `ContextInterceptor`

---

## Priority Extraction for `movelo-backend`

| Feature | Worth Adopting |
|---|---|
| Cluster setup with health monitoring | Yes — for production |
| OAuth2 guard patterns | Partially — cleaner guard structure |
| Request context (nestjs-cls + UUID logging) | Yes — directly applicable |
| `@LoggingDecorator` method decorator | Yes — drop-in useful |
| Event callback system (post-commit hooks) | Yes — adapt for Prisma `$transaction` |
| CLI commands (`generate-keys`, `route:list`) | Yes |
| Mail service + template rendering | Yes — if not already set up |
| Bootstrap checklist (Helmet, versioning, Swagger) | Yes — audit against current `main.ts` |

---

## Design Patterns Observed

1. **Strategy Pattern** — Grant types (implicit, PKCE, authorization code)
2. **Factory Pattern** — `JwtTokenManagerService`, `SessionConfigService`
3. **Decorator Pattern** — Template functions, method decorators
4. **Observer Pattern** — RxJS throughout (health checks, event emitter)
5. **Interceptor Pattern** — Cross-cutting concerns (context, session, redirect)
6. **Guard Pattern** — Authorization enforcement at route level
7. **Repository Pattern** — Data access via `*RepoService` classes