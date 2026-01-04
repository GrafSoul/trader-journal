import { createSlice } from "@reduxjs/toolkit";
import { fetchProfile, updateProfile } from "@/services/profileService";
import type { ProfileState } from "@/types/profile";
import { Statuses } from "@/store/statuses/statuses";

const initialState: ProfileState = {
  profile: null,
  status: Statuses.IDLE,
  error: null,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearProfileError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Profile
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.status = Statuses.SUCCEEDED;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = action.payload as string;
      });

    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.status = Statuses.LOADING;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.status = Statuses.SUCCEEDED;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.status = Statuses.FAILED;
        state.error = action.payload as string;
      });
  },
});

export const { clearProfileError } = profileSlice.actions;
export default profileSlice.reducer;
