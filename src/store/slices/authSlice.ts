import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  getSession,
  signIn,
  signUp,
  signOut,
  resetPasswordRequest,
  updatePassword,
  resetPassword,
  updateEmail,
} from '@/services/authService';
import type { AuthState, User, Session, AuthResponse } from '@/types/auth';
import { Statuses } from '@/store/statuses/statuses';

// ==================== INITIAL STATE ====================

const initialState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isInitialized: false,
  error: null,
  status: Statuses.IDLE,
};

// ==================== SLICE ====================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Clear auth data
    clearAuthData: (state) => {
      state.user = null;
      state.session = null;
      state.isAuthenticated = false;
      state.error = null;
      state.status = Statuses.IDLE;
    },

    // Clear errors
    clearAuthError: (state) => {
      state.error = null;
    },

    // Reset status to IDLE (for form mounting)
    resetAuthStatus: (state) => {
      state.status = Statuses.IDLE;
      state.error = null;
    },

    // Set auth from onAuthStateChange listener
    setAuth: (
      state,
      action: PayloadAction<{ user: User | null; session: Session | null }>
    ) => {
      state.user = action.payload.user;
      state.session = action.payload.session;
      state.isAuthenticated = !!action.payload.session;
      state.isInitialized = true;
      state.status = Statuses.SUCCEEDED;
    },
  },
  extraReducers: (builder) => {
    // ==================== GET SESSION ====================
    builder
      .addCase(getSession.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(getSession.fulfilled, (state, action: PayloadAction<Session | null>) => {
        state.status = Statuses.SUCCEEDED;
        state.session = action.payload;
        state.user = action.payload?.user ?? null;
        state.isAuthenticated = !!action.payload;
        state.isInitialized = true;
        state.error = null;
      })
      .addCase(getSession.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.isInitialized = true;
        state.error = (action.payload as string) || 'Failed to get session';
      })

      // ==================== SIGN IN ====================
      .addCase(signIn.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.status = Statuses.SUCCEEDED;
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.isAuthenticated = !!action.payload.session;
        state.error = null;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = (action.payload as string) || 'Failed to sign in';
      })

      // ==================== SIGN UP ====================
      .addCase(signUp.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.status = Statuses.SUCCEEDED;
        state.user = action.payload.user;
        state.session = action.payload.session;
        state.isAuthenticated = !!action.payload.session;
        state.error = null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = (action.payload as string) || 'Failed to sign up';
      })

      // ==================== SIGN OUT ====================
      .addCase(signOut.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(signOut.fulfilled, (state) => {
        state.status = Statuses.SUCCEEDED;
        state.user = null;
        state.session = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = (action.payload as string) || 'Failed to sign out';
      })

      // ==================== RESET PASSWORD REQUEST ====================
      .addCase(resetPasswordRequest.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(resetPasswordRequest.fulfilled, (state) => {
        state.status = Statuses.SUCCEEDED;
        state.error = null;
      })
      .addCase(resetPasswordRequest.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = (action.payload as string) || 'Failed to send reset email';
      })

      // ==================== UPDATE PASSWORD ====================
      .addCase(updatePassword.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(updatePassword.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = Statuses.SUCCEEDED;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = (action.payload as string) || 'Failed to update password';
      })

      // ==================== RESET PASSWORD (via email link) ====================
      .addCase(resetPassword.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = Statuses.SUCCEEDED;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = (action.payload as string) || 'Failed to reset password';
      })

      // ==================== UPDATE EMAIL ====================
      .addCase(updateEmail.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(updateEmail.fulfilled, (state, action: PayloadAction<User>) => {
        state.status = Statuses.SUCCEEDED;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateEmail.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = (action.payload as string) || 'Failed to update email';
      });
  },
});

// ==================== EXPORTS ====================

export const { clearAuthData, clearAuthError, resetAuthStatus, setAuth } = authSlice.actions;

export default authSlice.reducer;
