import { ExpenseCostType, IncomeSource, NftTier, TokenType } from "@prisma/client";
import { z } from "zod";
import { monthStringSchema } from "@/lib/month";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export const userCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(80),
  role: z.enum(["SUPERADMIN", "TEAM_USER"]),
  password: z.string().min(8),
});

export const userPatchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  role: z.enum(["SUPERADMIN", "TEAM_USER"]).optional(),
  isActive: z.boolean().optional(),
  mustChangePassword: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export const incomeCreateSchema = z.object({
  month: monthStringSchema,
  source: z.nativeEnum(IncomeSource),
  amountUsd: z.number().positive(),
  note: z.string().max(500).optional(),
});

export const expenseCreateSchema = z.object({
  month: monthStringSchema,
  category: z.string().min(1).max(100),
  vendor: z.string().min(1).max(120),
  costType: z.nativeEnum(ExpenseCostType),
  amountUsd: z.number().positive(),
  note: z.string().max(500).optional(),
});

export const statusPatchSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
  note: z.string().max(500).optional(),
});

export const nftSaleCreateSchema = z.object({
  month: monthStringSchema,
  tier: z.nativeEnum(NftTier),
  soldCount: z.number().int().min(0),
  unitPriceUsd: z.number().nonnegative(),
});

export const burningCreateSchema = z.object({
  month: monthStringSchema,
  token: z.nativeEnum(TokenType),
  amountToken: z.number().positive(),
  txUrl: z.string().url(),
  chain: z.string().min(2).max(50),
});

export const addressCreateSchema = z.object({
  label: z.string().min(2).max(120),
  amountValue: z.number().nonnegative().optional(),
  asset: z.string().min(2).max(40),
  chain: z.string().min(2).max(40),
  address: z.string().min(5).max(200),
  isActive: z.boolean().optional(),
});

export const allocationRuleCreateSchema = z.object({
  validFrom: monthStringSchema,
  nftPoolPct: z.number().min(0).max(1),
  buybackUttPct: z.number().min(0).max(1),
  buybackUsharkPct: z.number().min(0).max(1),
  teamPct: z.number().min(0).max(1),
  treasuryPct: z.number().min(0).max(1),
});

export const nftTierRuleCreateSchema = z.object({
  validFrom: monthStringSchema,
  bronzeMultiplier: z.number().positive(),
  silverMultiplier: z.number().positive(),
  goldMultiplier: z.number().positive(),
});

export const teamMemberCreateSchema = z.object({
  name: z.string().min(2).max(120),
  payoutPct: z.number().min(0).max(1),
  walletChain: z.string().max(60).optional(),
  walletAddress: z.string().max(200).optional(),
  validFrom: monthStringSchema.optional(),
});

export const teamMemberPatchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  payoutPct: z.number().min(0).max(1).optional(),
  walletChain: z.string().max(60).nullable().optional(),
  walletAddress: z.string().max(200).nullable().optional(),
  isActive: z.boolean().optional(),
  validFrom: monthStringSchema.optional(),
});

export const addressPatchSchema = z.object({
  label: z.string().min(2).max(120).optional(),
  amountValue: z.number().nonnegative().nullable().optional(),
  asset: z.string().min(2).max(40).optional(),
  chain: z.string().min(2).max(40).optional(),
  address: z.string().min(5).max(200).optional(),
  isActive: z.boolean().optional(),
});
