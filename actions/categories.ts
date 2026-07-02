"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import {
  createCategorySchema,
  deleteCategorySchema,
  renameCategorySchema,
} from "@/lib/validations/category";
import {
  createCategory,
  deleteCategory,
  listCategories,
  renameCategory,
} from "@/services/categoryService";
import type { ActionResult } from "@/actions/profile";

export type ListCategoriesResult =
  | { success: true; categories: { id: string; name: string; icon: string | null }[] }
  | { success: false; error: string };

export type DeleteCategoryResult =
  | { success: true }
  | { success: false; error: string; moveRequired?: boolean; itemCount?: number };

export async function listCategoriesAction(): Promise<ListCategoriesResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const categories = await listCategories(session.user.id);
  return {
    success: true,
    categories: categories.map((c) => ({
      id: String(c._id),
      name: c.name,
      icon: c.icon ?? null,
    })),
  };
}

export async function createCategoryAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await createCategory(session.user.id, parsed.data.name, parsed.data.icon);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/checklist");
  return { success: true };
}

export async function renameCategoryAction(input: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = renameCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await renameCategory(
    session.user.id,
    parsed.data.id,
    parsed.data.name,
    parsed.data.icon,
  );
  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/checklist");
  return { success: true };
}

export async function deleteCategoryAction(input: unknown): Promise<DeleteCategoryResult> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Not authenticated" };

  const parsed = deleteCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await deleteCategory(session.user.id, parsed.data.id, parsed.data.moveItemsTo);
  if (!result.success) {
    if (result.error === "MOVE_REQUIRED") {
      return {
        success: false,
        error: "This category still has items",
        moveRequired: true,
        itemCount: result.itemCount,
      };
    }
    return { success: false, error: result.error };
  }

  revalidatePath("/checklist");
  return { success: true };
}
