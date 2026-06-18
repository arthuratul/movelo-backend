-- DropIndex
DROP INDEX "oauth_clients_clientId_key";

-- AlterTable: drop clientId column from oauth_clients
ALTER TABLE "oauth_clients" DROP COLUMN "clientId";

-- RenameTable: refresh_tokens -> oauth_refresh_tokens
ALTER TABLE "refresh_tokens" RENAME TO "oauth_refresh_tokens";

-- Rename FK and primary key constraints to match new table name
ALTER TABLE "oauth_refresh_tokens" RENAME CONSTRAINT "refresh_tokens_userId_fkey" TO "oauth_refresh_tokens_userId_fkey";
ALTER TABLE "oauth_refresh_tokens" RENAME CONSTRAINT "refresh_tokens_clientId_fkey" TO "oauth_refresh_tokens_clientId_fkey";
ALTER TABLE "oauth_refresh_tokens" RENAME CONSTRAINT "refresh_tokens_pkey" TO "oauth_refresh_tokens_pkey";

-- Rename unique index on token column
ALTER INDEX "refresh_tokens_token_key" RENAME TO "oauth_refresh_tokens_token_key";