import { z } from "zod";

export const bagNameSchema = z.string().trim().min(1, "Bag name is required").max(60);

export const createBagSchema = z.object({
  name: bagNameSchema,
});

export const renameBagSchema = z.object({
  id: z.string().min(1),
  name: bagNameSchema,
});

export type CreateBagInput = z.infer<typeof createBagSchema>;
export type RenameBagInput = z.infer<typeof renameBagSchema>;
