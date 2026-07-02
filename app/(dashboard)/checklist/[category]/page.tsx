import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/lib/auth";
import { listItemsByCategory } from "@/services/checklistService";
import { listCategories } from "@/services/categoryService";
import { toPlain } from "@/lib/serialize";
import { CategoryView } from "@/features/checklist/category-view";
import type { ChecklistItemDTO } from "@/features/checklist/checklist-item-dto";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  return { title: `${decodeURIComponent(category)} — Pack with Me` };
}

export default async function ChecklistCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);

  const session = await auth();
  const categories = await listCategories(session!.user.id);

  if (!categories.some((c) => c.name === category)) {
    notFound();
  }

  const items = await listItemsByCategory(session!.user.id, category);

  const initialItems: ChecklistItemDTO[] = toPlain(items).map((i) => ({
    id: i._id,
    category: i.category,
    item: i.item,
    description: i.description ?? "",
    imageUrl: i.imageUrl ?? null,
    completed: i.completed,
    priority: i.priority,
    price: i.price ?? null,
    priceRangeMin: i.priceRangeMin ?? null,
    priceRangeMax: i.priceRangeMax ?? null,
    recommendedBrand: i.recommendedBrand ?? null,
    recommendedStore: i.recommendedStore ?? null,
    purchaseLink: i.purchaseLink ?? null,
    studentRating: i.studentRating ?? null,
    importance: i.importance ?? "",
  }));

  return (
    <CategoryView
      category={category}
      allCategories={categories.map((c) => c.name)}
      initialItems={initialItems}
    />
  );
}
