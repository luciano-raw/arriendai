-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Mi inmobiliaria',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" VARCHAR(200) NOT NULL,
    "owner" VARCHAR(100) NOT NULL,
    "tenant" VARCHAR(100) NOT NULL DEFAULT 'Sin arrendatario',
    "rent" DECIMAL(14,0) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'Disponible',
    "type" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_clerkUserId_key" ON "Workspace"("clerkUserId");

-- CreateIndex
CREATE INDEX "Property_workspaceId_createdAt_idx" ON "Property"("workspaceId", "createdAt");

-- Browser clients never access these tables directly. Server-side Prisma
-- authorizes against the Clerk session and uses the PostgreSQL service role.
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
