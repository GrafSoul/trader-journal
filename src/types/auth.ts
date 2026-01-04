// ==================== AUTH TYPES ====================

import type { User, Session } from '@supabase/supabase-js';
import type { StatusType } from '@/store/statuses/statuses';

// Re-export Supabase types
export type { User, Session };

// Auth credentials
export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
}

export interface ResetPasswordParams {
  email: string;
}

export interface UpdatePasswordParams {
  password: string;
}

export interface UpdateEmailParams {
  email: string;
}

// Auth response
export interface AuthResponse {
  user: User | null;
  session: Session | null;
}

// Redux auth state
export interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isInitialized: boolean; // True after first session check
  error: string | null;
  status: StatusType;
}
