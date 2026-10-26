-- CreateTable
CREATE TABLE "system_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "markdown" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "sidebar" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_pages_slug_key" ON "system_pages"("slug");

-- CreateIndex
CREATE INDEX "system_pages_sortOrder_idx" ON "system_pages"("sortOrder");
