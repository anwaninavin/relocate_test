export interface SuggestedItemDTO {
  key: string;
  name: string;
  category: string;
  usersUsing: number;
  completionPercent: number;
  mostPopularCollegeCategory: string | null;
  mostPopularCourse: string | null;
  firstAdded: string;
  lastUsed: string;
}

export interface SuggestedItemUserDTO {
  userId: string;
  name: string | null;
  mobile: string;
  collegeCategory: string | null;
  course: string | null;
  checked: boolean;
  addedAt: string;
}
