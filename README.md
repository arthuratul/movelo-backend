# movelo-backend

NestJS REST API. PostgreSQL via Prisma, RS256 JWT, OAuth2 Authorization Code + PKCE.

## Stack

- **NestJS v11** — global prefix `/api`, URI versioning (`/api/v1/...`)
- **Prisma v7** — split schema files in `prisma/schema/`, generated client in `generated/prisma/`
- **PostgreSQL** — AWS RDS in production
- **JWT RS256** — RSA key pair stored in `storage/`
- **OAuth2** — Authorization Code + PKCE, client credentials hashed with bcrypt
- **Swagger** — available at `/api/docs`

## Prerequisites

- Node.js 20+
- PostgreSQL database

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example and fill in the values:

```bash
cp .env .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Server port (default 3000) |
| `APP_URL` | Base URL of this API (e.g. `http://localhost:3000`) |
| `FRONTEND_URL` | Frontend origin for CORS |
| `JWT_PRIVATE_KEY_PATH` | Path to RSA private key (e.g. `storage/private.pem`) |
| `JWT_PUBLIC_KEY_PATH` | Path to RSA public key (e.g. `storage/public.pem`) |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL (e.g. `15m`) |
| `AUTH_CODE_TTL_SECONDS` | Authorization code TTL in seconds |
| `REFRESH_TOKEN_TTL_SECONDS` | Refresh token TTL in seconds |
| `MAIL_HOST` | SMTP host |
| `MAIL_PORT` | SMTP port |
| `MAIL_USER` | SMTP username |
| `MAIL_PASSWORD` | SMTP password |
| `MAIL_FROM` | Sender address |

### 3. Generate RSA keys

```bash
npm run cli -- keys:generate
```

This writes `storage/private.pem` and `storage/public.pem`. Never commit `private.pem`.

### 4. Run database migrations

```bash
npx prisma migrate deploy
```

### 5. Create an OAuth client

```bash
npm run cli -- oauth:create-client --name "My App" --client-id my-app
```

The client secret is printed once — store it securely.

## Running

```bash
# development (watch mode)
npm run start:dev

# production
npm run start:prod
```

## CLI

```bash
npm run cli -- <command>

# Available commands
npm run cli -- --help
```

| Command | Description |
|---|---|
| `oauth:create-client --name <name> --client-id <id>` | Create an OAuth client |
| `keys:generate` | Generate RSA key pair for JWT signing |

## API Docs

Swagger UI is available at `/api/docs` when the server is running.

## Tests

```bash
npm run test          # unit tests
npm run test:e2e      # e2e tests
npm run test:cov      # coverage
```