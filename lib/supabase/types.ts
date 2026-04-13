export type UserRole = "buyer" | "traveler" | "both";
export type DashboardMode = "buyer" | "traveler";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
}
