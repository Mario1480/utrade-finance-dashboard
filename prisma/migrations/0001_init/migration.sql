-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'TEAM_USER');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "IncomeSource" AS ENUM ('PIONEX_BOTS', 'COPY_BINGX', 'COPY_MEXC', 'OTHER', 'MIGRATION');

-- CreateEnum
CREATE TYPE "ExpenseCostType" AS ENUM ('MONTHLY', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "NftTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('UTT', 'USHARK');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "income_entries" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "source" "IncomeSource" NOT NULL,
    "amount_usd" DECIMAL(18,6) NOT NULL,
    "note" TEXT,
    "status" "EntryStatus" NOT NULL DEFAULT 'PENDING',
    "created_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "income_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_entries" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "cost_type" "ExpenseCostType" NOT NULL,
    "amount_usd" DECIMAL(18,6) NOT NULL,
    "note" TEXT,
    "status" "EntryStatus" NOT NULL DEFAULT 'PENDING',
    "created_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nft_monthly_sales" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "tier" "NftTier" NOT NULL,
    "sold_count" INTEGER NOT NULL,
    "unit_price_usd" DECIMAL(18,6) NOT NULL,
    "status" "EntryStatus" NOT NULL DEFAULT 'PENDING',
    "created_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nft_monthly_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocation_rules" (
    "id" TEXT NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "nft_pool_pct" DECIMAL(10,6) NOT NULL,
    "buyback_utt_pct" DECIMAL(10,6) NOT NULL,
    "buyback_ushark_pct" DECIMAL(10,6) NOT NULL,
    "team_pct" DECIMAL(10,6) NOT NULL,
    "treasury_pct" DECIMAL(10,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allocation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nft_tier_rules" (
    "id" TEXT NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "bronze_multiplier" DECIMAL(10,6) NOT NULL,
    "silver_multiplier" DECIMAL(10,6) NOT NULL,
    "gold_multiplier" DECIMAL(10,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nft_tier_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nft_sale_split_rules" (
    "id" TEXT NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "trading_pct" DECIMAL(10,6) NOT NULL,
    "infrastructure_pct" DECIMAL(10,6) NOT NULL,
    "operations_pct" DECIMAL(10,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nft_sale_split_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "payout_pct" DECIMAL(10,6) NOT NULL,
    "wallet_chain" TEXT,
    "wallet_address" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "burning_entries" (
    "id" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "token" "TokenType" NOT NULL,
    "amount_token" DECIMAL(28,6) NOT NULL,
    "tx_url" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "status" "EntryStatus" NOT NULL DEFAULT 'PENDING',
    "created_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "burning_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_addresses" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount_value" DECIMAL(28,6),
    "asset" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before_json" JSONB,
    "after_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "income_entries_month_idx" ON "income_entries"("month");

-- CreateIndex
CREATE INDEX "income_entries_status_idx" ON "income_entries"("status");

-- CreateIndex
CREATE INDEX "expense_entries_month_idx" ON "expense_entries"("month");

-- CreateIndex
CREATE INDEX "expense_entries_status_idx" ON "expense_entries"("status");

-- CreateIndex
CREATE INDEX "nft_monthly_sales_status_idx" ON "nft_monthly_sales"("status");

-- CreateIndex
CREATE UNIQUE INDEX "nft_monthly_sales_month_tier_key" ON "nft_monthly_sales"("month", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "allocation_rules_valid_from_key" ON "allocation_rules"("valid_from");

-- CreateIndex
CREATE UNIQUE INDEX "nft_tier_rules_valid_from_key" ON "nft_tier_rules"("valid_from");

-- CreateIndex
CREATE UNIQUE INDEX "nft_sale_split_rules_valid_from_key" ON "nft_sale_split_rules"("valid_from");

-- CreateIndex
CREATE INDEX "team_members_is_active_idx" ON "team_members"("is_active");

-- CreateIndex
CREATE INDEX "burning_entries_month_idx" ON "burning_entries"("month");

-- CreateIndex
CREATE INDEX "burning_entries_status_idx" ON "burning_entries"("status");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_entries" ADD CONSTRAINT "income_entries_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_entries" ADD CONSTRAINT "expense_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_entries" ADD CONSTRAINT "expense_entries_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nft_monthly_sales" ADD CONSTRAINT "nft_monthly_sales_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nft_monthly_sales" ADD CONSTRAINT "nft_monthly_sales_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "burning_entries" ADD CONSTRAINT "burning_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "burning_entries" ADD CONSTRAINT "burning_entries_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

