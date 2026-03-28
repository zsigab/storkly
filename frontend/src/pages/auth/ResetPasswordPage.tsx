import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/common/FormField";
import { getApiErrorMessage } from "@/api/helpers";
import { useResetPassword } from "@/hooks/useAuthMutations";

const schema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const resetPassword = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (token === null || token.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Invalid link</h1>
        <p className="text-muted-foreground">This password reset link is missing a token.</p>
        <Link to="/forgot-password" className="text-primary text-sm hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-16">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Set new password</h1>
        <p className="text-muted-foreground">Choose a password with at least 8 characters.</p>
      </div>

      <form
        className="space-y-4"
        noValidate
        onSubmit={handleSubmit(({ newPassword }) => resetPassword.mutate({ token, newPassword }))}
      >
        <FormField label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            {...register("newPassword")}
          />
        </FormField>

        <FormField
          label="Confirm password"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
        </FormField>

        {resetPassword.isError && (
          <Alert variant="destructive">
            <AlertDescription>{getApiErrorMessage(resetPassword.error)}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
          {resetPassword.isPending ? "Saving…" : "Set new password"}
        </Button>
      </form>
    </div>
  );
}
