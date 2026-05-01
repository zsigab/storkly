import { Navigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";

export function HomePage(): React.ReactElement {
  const { user } = useAuth();

  if (user !== null) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="py-16 text-center">
      <h1 className="text-foreground text-4xl font-semibold">Welcome to Storkly</h1>
      <p className="text-muted-foreground mt-4">Your gift registry, simplified.</p>
    </div>
  );
}
