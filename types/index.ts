export type UserRole = "student" | "admin";

export interface UserDTO {
  id: string;
  name: string | null;
  mobile: string;
  avatar: string | null;
  college: string | null;
  hostel: string | null;
  roomNumber: string | null;
  role: UserRole;
  theme: "light" | "dark" | "system";
  createdAt: string;
}

/**
 * The starter set of checklist categories seeded for every new user (and reused, unchanged,
 * as the fixed category list for shopping Products/admin). Checklist categories themselves are
 * dynamic and per-user from here on — see models/Category.ts / services/categoryService.ts —
 * so a checklist item's `category` is just a free-form string, not this union.
 */
export const DEFAULT_CHECKLIST_CATEGORIES = [
  "Documents",
  "Clothes",
  "Footwear",
  "Electronics",
  "Medicines",
  "Toiletries",
  "Laundry",
  "Stationery",
  "Kitchen",
  "Hostel Essentials",
  "Fashion Design Tools",
  "Emergency",
  "Miscellaneous",
] as const;

/** Fixed category union still used by shopping Products (admin-managed, not per-user). */
export type ProductCategory = (typeof DEFAULT_CHECKLIST_CATEGORIES)[number];

/** Dynamic, user-managed — see services/categoryService.ts. */
export type ChecklistCategory = string;

export const CHECKLIST_PRIORITIES = ["low", "medium", "high"] as const;
export type ChecklistPriority = (typeof CHECKLIST_PRIORITIES)[number];

export const BUDGET_ENTRY_TYPES = ["planned", "expense"] as const;
export type BudgetEntryType = (typeof BUDGET_ENTRY_TYPES)[number];

export const BUDGET_CATEGORIES = [
  "Clothing",
  "Electronics",
  "Food",
  "Toiletries",
  "Stationery",
  "Travel",
  "Medical",
  "Rent",
  "Miscellaneous",
] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export const STORE_OPTIONS = [
  "Amazon",
  "Flipkart",
  "Myntra",
  "Decathlon",
  "Local Store",
] as const;
export type StoreOption = (typeof STORE_OPTIONS)[number];

export interface NoteDTO {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  updatedAt: string;
}

export const GUIDE_CATEGORIES = [
  "Packing",
  "Laundry",
  "Etiquette",
  "Safety",
  "Women Safety",
  "Medical",
  "Documents",
  "Emergency",
  "First Week",
  "Budget Planning",
] as const;
export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];
