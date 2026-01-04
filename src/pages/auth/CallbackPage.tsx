import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

const CallbackPage = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Check for errors in URL hash first
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const error = hashParams.get("error");
    const errorDescription = hashParams.get("error_description");

    if (error) {
      console.error("Auth error:", error, errorDescription);
      // Redirect to login with error
      navigate("/auth/login", { replace: true });
      return;
    }

    // Listen for auth state changes - this is where Supabase will tell us what happened
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("📥 Callback received auth event:", event);

      if (event === "PASSWORD_RECOVERY") {
        // Recovery flow - redirect to reset password
        console.log("🔑 Recovery detected in callback, redirecting...");
        navigate("/auth/reset-password", { replace: true });
        setIsProcessing(false);
      } else if (event === "SIGNED_IN") {
        // Normal sign in - redirect to dashboard
        console.log("✅ Sign in detected, redirecting to dashboard...");
        navigate("/dashboard", { replace: true });
        setIsProcessing(false);
      } else if (event === "INITIAL_SESSION" && session) {
        // Already have a session - check URL for type
        const url = new URL(window.location.href);
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const type = hashParams.get("type") || url.searchParams.get("type");

        console.log("📋 Initial session with type:", type);

        if (type === "recovery") {
          navigate("/auth/reset-password", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
        setIsProcessing(false);
      }
    });

    // Fallback: if no auth event after 3 seconds, check session manually
    const timeout = setTimeout(async () => {
      if (isProcessing) {
        console.log("⏱️ Timeout - checking session manually");
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          const url = new URL(window.location.href);
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1)
          );
          const type = hashParams.get("type") || url.searchParams.get("type");

          if (type === "recovery") {
            navigate("/auth/reset-password", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        } else {
          navigate("/auth/login", { replace: true });
        }
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate, isProcessing]);

  return <LoadingScreen />;
};

export default CallbackPage;
