# movelo-backend

NestJS REST API. PostgreSQL via Prisma, RS256 JWT, OAuth2 Authorization Code + PKCE, Google Sign-In.

## Stack

- **NestJS v11** — global prefix `/api`, URI versioning (`/api/v1/...`)
- **Prisma v7** — split schema files in `prisma/schema/`, generated client in `generated/prisma/`
- **PostgreSQL** — AWS RDS in production
- **JWT RS256** — RSA key pair stored in `storage/`
- **OAuth2** — Standard Authorization Code + PKCE (RFC 7636 + RFC 8252), public clients only
- **Google OAuth2** — Sign in with Google via Passport strategy
- **Server-rendered views** — Handlebars templates for the login and signup pages
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
npm run cli -- oauth:create-client --name "Movelo SPA" --redirect-uri http://localhost:3001/auth/callback
```

Repeat `--redirect-uri` for multiple URIs. The printed `client_id` is what your frontend/mobile app uses.

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
| `oauth:create-client --name <name> --redirect-uri <uri>` | Create a public OAuth client |
| `keys:generate` | Generate RSA key pair for JWT signing |


## API Endpoints

Full interactive docs available at `/api/docs`.

## Tests

```bash
npm run test          # unit tests
npm run test:e2e      # e2e tests
npm run test:cov      # coverage
```
