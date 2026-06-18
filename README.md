# movelo-backend

NestJS REST API. PostgreSQL via Prisma, RS256 JWT, OAuth2 Authorization Code + PKCE.

## Stack

- **NestJS v11** — global prefix `/api`, URI versioning (`/api/v1/...`)
- **Prisma v7** — split schema files in `prisma/schema/`, generated client in `generated/prisma/`
- **PostgreSQL** — AWS RDS in production
- **JWT RS256** — RSA key pair stored in `storage/`
- **OAuth2** — Standard Authorization Code + PKCE (RFC 7636 + RFC 8252), public clients only
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
| `FRONTEND_URL` | Frontend origin for CORS and login redirect (e.g. `http://localhost:3001`) |
| `JWT_PRIVATE_KEY_PATH` | Path to RSA private key (e.g. `storage/private.pem`) |
| `JWT_PUBLIC_KEY_PATH` | Path to RSA public key (e.g. `storage/public.pem`) |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL in seconds (e.g. `900`) |
| `AUTH_CODE_TTL_SECONDS` | Authorization code TTL in seconds (e.g. `300`) |
| `REFRESH_TOKEN_TTL_SECONDS` | Refresh token TTL in seconds (e.g. `2592000`) |
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

## OAuth2 Authorization Code + PKCE Flow

This server implements the standard OAuth2 Authorization Code flow with PKCE (RFC 7636) for public clients (SPA, mobile). There is no `client_secret` — clients are identified by `client_id` and the PKCE `code_verifier`.

```
1. Client generates code_verifier (random 43-128 chars) and
   code_challenge = BASE64URL(SHA256(code_verifier))

2. Client opens system browser to:
   GET /api/v1/auth/authorize
     ?response_type=code
     &client_id=<id>
     &redirect_uri=<registered_uri>
     &code_challenge=<challenge>
     &code_challenge_method=S256
     &state=<random_nonce>

3. Server validates params, redirects browser to:
   FRONTEND_URL/login?client_id=...&redirect_uri=...&code_challenge=...&state=...

4. Frontend shows login form, user submits credentials.
   Frontend calls:
   POST /api/v1/auth/authorize/login
   { email, password, client_id, redirect_uri, code_challenge, code_challenge_method, state }

5. Server validates credentials, creates auth code, returns:
   { redirect_to: "<redirect_uri>?code=<code>&state=<nonce>" }

6. Frontend navigates browser to redirect_to.
   OS delivers the redirect to the client app.

7. Client validates state matches step 1, then calls:
   POST /api/v1/auth/token
   { grant_type: "authorization_code", client_id, code, redirect_uri, code_verifier }

8. Server verifies PKCE, issues tokens:
   { access_token, refresh_token, token_type, expires_in }
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/auth/signup` | Register a new user |
| `GET` | `/api/v1/auth/verify-email` | Verify email address |
| `GET` | `/api/v1/auth/authorize` | Start OAuth2 authorization (redirects to frontend login) |
| `POST` | `/api/v1/auth/authorize/login` | Submit credentials, receive redirect URL with auth code |
| `POST` | `/api/v1/auth/token` | Exchange auth code + code_verifier for tokens |
| `POST` | `/api/v1/auth/refresh` | Rotate refresh token |
| `POST` | `/api/v1/auth/logout` | Revoke refresh token |

Full interactive docs available at `/api/docs`.

## Tests

```bash
npm run test          # unit tests
npm run test:e2e      # e2e tests
npm run test:cov      # coverage
```
