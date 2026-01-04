import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAppDispatch } from "@/store/hooks";
import { getSession } from "@/services/authService";
import { setAuth } from "@/store/slices/authSlice";
import { supabase } from "@/lib/supabase";

export const RootLayout = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Get initial session
    dispatch(getSession());

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        dispatch(setAuth({ user: session?.user ?? null, session }));
      } else if (event === "SIGNED_OUT") {
        dispatch(setAuth({ user: null, session: null }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);

  return <Outlet />;
};
