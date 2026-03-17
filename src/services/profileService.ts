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
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      // Auto-create profile if it doesn't exist (upsert to handle conflicts)
      if (!data) {
        const { data: upserted, error: upsertError } = await supabase
          .from("profiles")
          .upsert({ id: user.id } as never, { onConflict: "id" })
          .select()
          .maybeSingle();

        if (upsertError) {
          throw new Error(upsertError.message);
        }

        if (!upserted) {
          throw new Error("Could not load or create profile. Check RLS policies on profiles table.");
        }

        return upserted;
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
