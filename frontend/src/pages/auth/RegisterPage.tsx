import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router";
import { Turnstile } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/common/FormField";
import { getApiErrorMessage } from "@/api/helpers";
import { useRegister } from "@/hooks/useAuthMutations";

const schema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  captchaToken: z.string().min(1, "Please complete the CAPTCHA"),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage(): React.ReactElement {
  const registerMutation = useRegister();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { captchaToken: "" },
  });

  if (registerMutation.isSuccess) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Check your email</h1>
        <p className="text-muted-foreground">
          {
            "We've sent a verification link to your email address. Click it to activate your account."
          }
        </p>
        <Link to="/login" className="text-primary text-sm hover:underline">
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-16">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground">Start building your gift registry</p>
      </div>

      <form
        className="space-y-4"
        noValidate
        onSubmit={handleSubmit((values) => registerMutation.mutate(values))}
      >
        <FormField label="Display name" htmlFor="displayName" error={errors.displayName?.message}>
          <Input id="displayName" type="text" autoComplete="name" {...register("displayName")} />
        </FormField>

        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
        </FormField>

        <div className="space-y-2">
          <Turnstile
            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA"}
            onSuccess={(token) => setValue("captchaToken", token, { shouldValidate: true })}
          />
          {errors.captchaToken !== undefined && (
            <p className="text-destructive text-sm">{errors.captchaToken.message}</p>
          )}
        </div>

        {registerMutation.isError && (
          <Alert variant="destructive">
            <AlertDescription>{getApiErrorMessage(registerMutation.error)}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <div className="relative flex items-center">
        <div className="border-border flex-grow border-t" />
        <span className="text-muted-foreground mx-3 text-xs">or</span>
        <div className="border-border flex-grow border-t" />
      </div>

      <div className="space-y-2">
        <a href="/api/auth/oauth/google/authorize" className="block">
          <Button variant="outline" className="w-full" type="button">
            Continue with Google
          </Button>
        </a>
        <a href="/api/auth/oauth/facebook/authorize" className="block">
          <Button variant="outline" className="w-full" type="button">
            Continue with Facebook
          </Button>
        </a>
      </div>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
