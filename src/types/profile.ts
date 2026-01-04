import type { StatusType } from "@/store/statuses/statuses";

export interface Profile {
  id: string;
  display_name: string | null;
  base_currency: string;
  timezone: string;
  risk_default_percent: number | null;
  risk_default_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileDto {
  display_name?: string | null;
  base_currency?: string;
  timezone?: string;
  risk_default_percent?: number | null;
  risk_default_amount?: number | null;
}

export interface ProfileState {
  profile: Profile | null;
  status: StatusType;
  error: string | null;
}
