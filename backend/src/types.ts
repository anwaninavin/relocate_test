export type UserRole = "student" | "admin";

export const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;
export type Gender = (typeof GENDER_OPTIONS)[number];

export const COLLEGE_CATEGORY_OPTIONS = [
  "Designing",
  "Engineering",
  "Medical",
  "Commerce",
  "Arts",
  "Other",
] as const;
export type CollegeCategory = (typeof COLLEGE_CATEGORY_OPTIONS)[number];

export interface UserDTO {
  id: string;
  name: string | null;
  mobile: string;
  avatar: string | null;
  gender: Gender | null;
  college: string | null;
  collegeCategory: CollegeCategory | null;
  role: UserRole;
  theme: "light" | "dark" | "system";
  needsOnboarding: boolean;
  createdAt: string;
}

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

export type ProductCategory = (typeof DEFAULT_CHECKLIST_CATEGORIES)[number];
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

export const STORE_OPTIONS = ["Amazon", "Flipkart", "Myntra", "Decathlon", "Local Store"] as const;
export type StoreOption = (typeof STORE_OPTIONS)[number];

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
