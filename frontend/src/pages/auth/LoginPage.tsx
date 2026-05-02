import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, Navigate, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/common/FormField";
import { getApiErrorMessage } from "@/api/helpers";
import { useLogin } from "@/hooks/useAuthMutations";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage(): React.ReactElement {
  const { user } = useAuth();
  const login = useLogin();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (user !== null) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-16">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-muted-foreground">Welcome back to Storkly</p>
      </div>

      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit((values) =>
          login.mutate({ ...values, ...(from !== undefined && { from }) }),
        )}
      >
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
        </FormField>

        {login.isError && (
          <Alert variant="destructive">
            <AlertDescription>{getApiErrorMessage(login.error)}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="relative flex items-center">
        <div className="border-border flex-grow border-t" />
        <span className="text-muted-foreground mx-3 text-xs">or</span>
        <div className="border-border flex-grow border-t" />
      </div>

      <a href="/api/auth/oauth/google/authorize" className="block">
        <Button variant="outline" className="w-full" type="button">
          Continue with Google
        </Button>
      </a>

      <div className="space-y-1 text-center text-sm">
        <p>
          <Link to="/forgot-password" className="text-primary hover:underline">
            Forgot your password?
          </Link>
        </p>
        <p className="text-muted-foreground">
          {"Don't have an account? "}
          <Link to="/register" className="text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
