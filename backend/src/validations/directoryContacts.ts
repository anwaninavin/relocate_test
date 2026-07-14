import { z } from "zod";

import { CONTACT_CATEGORIES } from "@/types";

export const directoryContactSchema = z.object({
  city: z.string().trim().min(1, "Enter a city").max(80),
  category: z.enum(CONTACT_CATEGORIES),
  name: z.string().trim().min(1, "Enter a name").max(100),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(20),
  whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  description: z.string().trim().max(300).optional().or(z.literal("")),
});

export type DirectoryContactInput = z.infer<typeof directoryContactSchema>;

export const reportContactSchema = z.object({
  reason: z.string().trim().min(1, "Describe the issue").max(300),
});

export const directoryContactQuerySchema = z.object({
  city: z.string().trim().min(1).max(80),
  category: z.enum(CONTACT_CATEGORIES).optional(),
  search: z.string().trim().max(100).optional(),
});
