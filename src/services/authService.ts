import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/lib/supabase';
import type {
  AuthResponse,
  SignInCredentials,
  SignUpCredentials,
  User,
  Session,
} from '@/types/auth';
import * as types from '@/store/constants/actionTypes';

// ==================== GET SESSION ====================
export const getSession = createAsyncThunk<Session | null, void>(
  types.AUTH_GET_SESSION,
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.warn('❌ Error getting session:', error);
        throw new Error(error.message);
      }

      return data.session;
    } catch (error) {
      console.warn('❌ getSession failed:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
);

// ==================== SIGN IN ====================
export const signIn = createAsyncThunk<AuthResponse, SignInCredentials>(
  types.AUTH_SIGN_IN,
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.warn('❌ Error signing in:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.warn('❌ signIn failed:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
);

// ==================== SIGN UP ====================
export const signUp = createAsyncThunk<AuthResponse, SignUpCredentials>(
  types.AUTH_SIGN_UP,
  async ({ email, password, displayName }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        console.warn('❌ Error signing up:', error);
        throw new Error(error.message);
      }

      // Update profile with display name after signup
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ display_name: displayName } as never)
          .eq('id', data.user.id);
      }

      return data;
    } catch (error) {
      console.warn('❌ signUp failed:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
);

// ==================== SIGN OUT ====================
export const signOut = createAsyncThunk<void, void>(
  types.AUTH_SIGN_OUT,
  async (_, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.warn('❌ Error signing out:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.warn('❌ signOut failed:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
);

// ==================== RESET PASSWORD REQUEST ====================
export const resetPasswordRequest = createAsyncThunk<void, string>(
  types.AUTH_RESET_PASSWORD_REQUEST,
  async (email, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (error) {
        console.warn('❌ Error requesting password reset:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.warn('❌ resetPasswordRequest failed:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
);

// ==================== UPDATE PASSWORD (with current password verification) ====================
export const updatePassword = createAsyncThunk<User, { currentPassword: string; newPassword: string }>(
  types.AUTH_UPDATE_PASSWORD,
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      // First verify current password by re-authenticating
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error('User not found');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('currentPasswordInvalid');
      }

      // Update to new password
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        console.warn('❌ Error updating password:', error);
        throw new Error(error.message);
      }

      return data.user;
    } catch (error) {
      console.warn('❌ updatePassword failed:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
);

// ==================== RESET PASSWORD (via email recovery link) ====================
export const resetPassword = createAsyncThunk<User, string>(
  types.AUTH_RESET_PASSWORD,
  async (password, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.warn('❌ Error resetting password:', error);
        throw new Error(error.message);
      }

      return data.user;
    } catch (error) {
      console.warn('❌ resetPassword failed:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
);

// ==================== UPDATE EMAIL ====================
export const updateEmail = createAsyncThunk<User, string>(
  types.AUTH_UPDATE_EMAIL,
  async (email, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.auth.updateUser({ email });

      if (error) {
        console.warn('❌ Error updating email:', error);
        throw new Error(error.message);
      }

      return data.user;
    } catch (error) {
      console.warn('❌ updateEmail failed:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
);

// ==================== RESEND CONFIRMATION ====================
export const resendConfirmation = createAsyncThunk<void, string>(
  types.AUTH_RESEND_CONFIRMATION,
  async (email, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        console.warn('❌ Error resending confirmation:', error);
        throw new Error(error.message);
      }
    } catch (error) {
      console.warn('❌ resendConfirmation failed:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
);
