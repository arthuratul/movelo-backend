/*
  Warnings:

  - Added the required column `redirectUri` to the `authorization_codes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('PUBLIC', 'CONFIDENTIAL');

-- AlterTable
ALTER TABLE "authorization_codes" ADD COLUMN     "redirectUri" TEXT NOT NULL,
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "oauth_clients" ADD COLUMN     "clientType" "ClientType" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "redirectUris" TEXT[],
ALTER COLUMN "clientSecret" DROP NOT NULL;
