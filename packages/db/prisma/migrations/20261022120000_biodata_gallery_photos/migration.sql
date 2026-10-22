-- CreateTable
CREATE TABLE "biodata_gallery_photos" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "biodata_gallery_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "biodata_gallery_photos_profileId_sortOrder_idx" ON "biodata_gallery_photos"("profileId", "sortOrder");

-- AddForeignKey
ALTER TABLE "biodata_gallery_photos" ADD CONSTRAINT "biodata_gallery_photos_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
