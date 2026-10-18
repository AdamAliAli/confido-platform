CREATE TABLE "TeamMember" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "quote" TEXT,
  "photoUrl" TEXT NOT NULL,
  "xUrl" TEXT,
  "dribbbleUrl" TEXT,
  "linkedinUrl" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TeamMember_sortOrder_idx" ON "TeamMember"("sortOrder");
