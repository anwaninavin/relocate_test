import { connectDB } from "@/db";
import { ChecklistTemplate } from "@/models/ChecklistTemplate";
import { DefaultChecklistItem } from "@/models/DefaultChecklistItem";
import { DEFAULT_CHECKLIST_TEMPLATE } from "@/lib/defaultChecklistTemplate";

/** Populates a template that has zero DefaultChecklistItem rows with the hardcoded starter
 * checklist, so `findApplicableItems` never comes back empty just because nobody has run the
 * admin taxonomy importer (scripts/seedChecklistTaxonomy.ts) yet. Items are unrestricted
 * (visible to every college category / course / gender) — admins can narrow targeting later
 * via the taxonomy panel. Safe to call repeatedly: only inserts when the template is empty. */
async function ensureTemplateHasDefaultItems(templateId: string) {
  const hasItems = await DefaultChecklistItem.exists({ templateId });
  if (hasItems) return;

  const docs = DEFAULT_CHECKLIST_TEMPLATE.map((item, index) => ({
    templateId,
    category: item.category,
    title: item.item,
    description: item.description ?? "",
    priority: item.priority,
    sortOrder: index,
    isForAllCollegeCategories: true,
    isForAllCourses: true,
    active: true,
  }));

  await DefaultChecklistItem.insertMany(docs, { ordered: false }).catch(() => {
    // A concurrent request may have seeded first — fine, the exists() check above already
    // avoids duplicating on the common path.
  });
}

/** Idempotent bootstrap: every environment needs at least one active template with default
 * items before checklist generation can produce anything. Safe to call on every request that
 * needs it — only creates "Default Template" v1 the first time, and self-heals a template left
 * empty by a skipped/failed taxonomy import. */
export async function getOrCreateActiveTemplate() {
  await connectDB();

  const existing = await ChecklistTemplate.findOne({ active: true }).sort({ version: -1 }).lean();
  if (existing) {
    await ensureTemplateHasDefaultItems(String(existing._id));
    return existing;
  }

  const template = await ChecklistTemplate.create({
    name: "Default Template",
    version: 1,
    description: "Master packing checklist template",
    published: true,
    active: true,
  });
  await ensureTemplateHasDefaultItems(String(template._id));
  return template;
}

export async function listChecklistTemplates() {
  await connectDB();
  return ChecklistTemplate.find().sort({ version: -1 }).lean();
}

export async function createChecklistTemplate(input: { name: string; description?: string; version?: number }) {
  await connectDB();
  const latest = await ChecklistTemplate.findOne().sort({ version: -1 }).lean();
  const version = input.version ?? (latest ? latest.version + 1 : 1);
  const template = await ChecklistTemplate.create({
    name: input.name.trim(),
    version,
    description: input.description ?? "",
    published: false,
    active: false,
  });
  return { success: true as const, template };
}

export async function updateChecklistTemplate(
  id: string,
  input: { name?: string; description?: string; published?: boolean; active?: boolean },
) {
  await connectDB();

  // Only one template is ever "active" (the one checklist generation reads from) — activating
  // this one deactivates every other.
  if (input.active) {
    await ChecklistTemplate.updateMany({ _id: { $ne: id } }, { active: false });
  }

  const template = await ChecklistTemplate.findByIdAndUpdate(id, input, { returnDocument: "after" }).lean();
  if (!template) {
    return { success: false as const, error: "Template not found" };
  }
  return { success: true as const, template };
}
