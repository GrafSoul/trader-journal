import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

const CallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error) {
        console.error("Auth callback error:", error);
        navigate("/auth/login", { replace: true });
        return;
      }

      navigate("/dashboard", { replace: true });
    };

    handleCallback();
  }, [navigate]);

  return <LoadingScreen />;
};

export default CallbackPage;
