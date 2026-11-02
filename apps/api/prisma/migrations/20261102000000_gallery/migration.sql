CREATE TABLE "GalleryItem" (
  "id" TEXT NOT NULL,
  "section" TEXT NOT NULL,
  "mediaType" TEXT NOT NULL,
  "publicId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "client" TEXT,
  "category" TEXT,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "position" INTEGER NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GalleryItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GalleryItem_section_check" CHECK ("section" IN ('brand', 'work')),
  CONSTRAINT "GalleryItem_mediaType_check" CHECK ("mediaType" IN ('image', 'video'))
);
CREATE UNIQUE INDEX "GalleryItem_publicId_key" ON "GalleryItem"("publicId");
CREATE UNIQUE INDEX "GalleryItem_section_position_key" ON "GalleryItem"("section", "position");
