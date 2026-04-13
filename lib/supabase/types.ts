export type UserRole = "buyer" | "traveler" | "both";

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  phone_e164: string | null;
  phone_verified: boolean;
  is_admin: boolean;
  kyc_status: "pending" | "approved" | "rejected";
}
