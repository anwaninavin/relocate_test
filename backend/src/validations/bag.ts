import { z } from "zod";

export const bagNameSchema = z.string().trim().min(1, "Bag name is required").max(60);

export const bagColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value like #7C9CF2");

export const createBagSchema = z.object({
  name: bagNameSchema,
  color: bagColorSchema.optional(),
});

export const updateBagSchema = z.object({
  id: z.string().min(1),
  name: bagNameSchema.optional(),
  color: bagColorSchema.optional(),
});

export type CreateBagInput = z.infer<typeof createBagSchema>;
export type UpdateBagInput = z.infer<typeof updateBagSchema>;
