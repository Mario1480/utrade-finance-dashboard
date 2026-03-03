-- CreateTable
CREATE TABLE "public"."community_month_status" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "closed_at" TIMESTAMP(3),
    "closed_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_month_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "community_month_status_month_key" ON "public"."community_month_status"("month");

-- CreateIndex
CREATE INDEX "community_month_status_is_closed_month_idx" ON "public"."community_month_status"("is_closed", "month");

-- AddForeignKey
ALTER TABLE "public"."community_month_status" ADD CONSTRAINT "community_month_status_closed_by_id_fkey" FOREIGN KEY ("closed_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
