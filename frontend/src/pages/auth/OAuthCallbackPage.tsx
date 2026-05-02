import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { api } from "@/api";
import { useAuth } from "@/hooks/useAuth";

export function OAuthCallbackPage(): React.ReactElement {
  const { login } = useAuth();
  const navigate = useNavigate();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    void api.GET("/api/auth/me", {}).then(({ data, error }) => {
      if (error !== undefined || data === undefined || data === null) {
        void navigate("/login?error=oauth", { replace: true });
        return;
      }
      login(data);
      void navigate("/dashboard", { replace: true });
    });
  }, [login, navigate]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-muted-foreground">Signing you in…</p>
    </div>
  );
}
