import { z } from "zod";

const entryTypeSchema = z.enum(["asset", "liability"]);
const currencySchema = z.enum(["TWD", "USD"]);
const snapshotStatusSchema = z.enum(["draft", "final"]);

export const categorySchema = z.object({
  type: entryTypeSchema,
  code: z.string().trim().min(2).max(50),
  name: z.string().trim().min(1).max(50),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.coerce.boolean().default(true),
});

export const itemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  institution: z.string().trim().max(80).optional().or(z.literal("")),
  currency: currencySchema,
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.coerce.boolean().default(true),
  note: z.string().trim().max(240).optional().or(z.literal("")),
});

export const snapshotCreateSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  sourceSnapshotId: z.string().optional(),
  usdFxRate: z.coerce.number().positive().max(999).optional(),
  note: z.string().trim().max(240).optional().or(z.literal("")),
});

export const snapshotEntrySchema = z.object({
  id: z.string().optional(),
  itemId: z.string().min(1),
  amountOriginal: z.coerce.number().min(0),
  fxRate: z.coerce.number().positive().optional(),
  note: z.string().trim().max(240).optional().or(z.literal("")),
});

export const snapshotEditorEntrySchema = z.object({
  id: z.string().optional(),
  itemId: z.string().min(1),
  amountOriginal: z.coerce.number().min(0),
  note: z.string().trim().max(240).optional().or(z.literal("")),
});

export const snapshotUpdateSchema = z.object({
  status: snapshotStatusSchema.default("draft"),
  usdFxRate: z.coerce.number().positive().max(999),
  note: z.string().trim().max(240).optional().or(z.literal("")),
  entries: z.array(snapshotEditorEntrySchema),
});

export const reportBreakdownQuerySchema = z.object({
  snapshotId: z.string().min(1),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type ItemInput = z.infer<typeof itemSchema>;
export type SnapshotCreateInput = z.infer<typeof snapshotCreateSchema>;
export type SnapshotUpdateInput = z.infer<typeof snapshotUpdateSchema>;
