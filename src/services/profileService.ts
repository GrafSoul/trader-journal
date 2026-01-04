import { createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "@/lib/supabase";
import type { Profile, UpdateProfileDto } from "@/types/profile";
import type { Database } from "@/types/database";
import * as types from "@/store/constants/actionTypes";

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

// ==================== FETCH PROFILE ====================
export const fetchProfile = createAsyncThunk<Profile, void>(
  types.PROFILE_FETCH,
  async (_, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

// ==================== UPDATE PROFILE ====================
export const updateProfile = createAsyncThunk<Profile, UpdateProfileDto>(
  types.PROFILE_UPDATE,
  async (profileData, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      const updateData = {
        ...profileData,
        updated_at: new Date().toISOString(),
      } as ProfileUpdate;

      const { data, error } = await supabase
        .from("profiles")
        .update(updateData as never)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);
