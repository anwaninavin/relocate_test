import type { CollegeCategory, Gender, UserRole } from "@/types";

export interface AdminUserDTO {
  id: string;
  name: string | null;
  mobile: string;
  gender: Gender | null;
  college: string | null;
  collegeCategory: CollegeCategory | null;
  role: UserRole;
  verified: boolean;
  hasPinSet: boolean;
  createdAt: string;
}
