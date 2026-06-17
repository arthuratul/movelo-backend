-- CreateTable
CREATE TABLE "oauth_clients" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "oauth_clients_clientId_key" ON "oauth_clients"("clientId");

-- Insert a legacy seed client for existing rows
INSERT INTO "oauth_clients" ("id", "clientId", "clientSecret", "name")
VALUES ('00000000-0000-0000-0000-000000000000', 'legacy', 'legacy', 'Legacy (pre-client)');

-- AlterTable: add as nullable first
ALTER TABLE "authorization_codes" ADD COLUMN "clientId" TEXT;
ALTER TABLE "refresh_tokens" ADD COLUMN "clientId" TEXT;

-- Backfill existing rows with the legacy client
UPDATE "authorization_codes" SET "clientId" = '00000000-0000-0000-0000-000000000000';
UPDATE "refresh_tokens" SET "clientId" = '00000000-0000-0000-0000-000000000000';

-- Make NOT NULL now that all rows have a value
ALTER TABLE "authorization_codes" ALTER COLUMN "clientId" SET NOT NULL;
ALTER TABLE "refresh_tokens" ALTER COLUMN "clientId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "authorization_codes" ADD CONSTRAINT "authorization_codes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;