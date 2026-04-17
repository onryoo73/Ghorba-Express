export type UserRole = "buyer" | "traveler" | "both";
export type DashboardMode = "buyer" | "traveler";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  role: UserRole;
  rating: number;
  total_deliveries: number;
  avatar_url?: string | null;
  verified?: boolean | null;
}
