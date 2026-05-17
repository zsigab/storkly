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
import { useForgotPassword } from "@/hooks/useAuthMutations";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  captchaToken: z.string().min(1, "Please complete the CAPTCHA"),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage(): React.ReactElement {
  const forgotPassword = useForgotPassword();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { captchaToken: "" } });

  if (forgotPassword.isSuccess) {
    return (
      <div className="mx-auto max-w-md py-16">
        <div className="bg-card text-card-foreground space-y-4 rounded-xl p-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Check your email</h1>
          <p className="text-muted-foreground">
            {"If that address is registered, we've sent a password reset link."}
          </p>
          <Link to="/login" className="text-primary text-sm hover:underline">
            Return to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-16">
      <div className="bg-card text-card-foreground space-y-6 rounded-xl p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Reset your password</h1>
          <p className="text-muted-foreground">
            {"Enter your email and we'll send you a reset link."}
          </p>
        </div>

        <form
          className="space-y-4"
          noValidate
          onSubmit={handleSubmit((values) => forgotPassword.mutate(values))}
        >
          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
          </FormField>

          <div className="flex justify-center">
            <Turnstile
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY as string}
              onSuccess={(token) => setValue("captchaToken", token, { shouldValidate: true })}
            />
          </div>
          {errors.captchaToken !== undefined && (
            <p className="text-destructive text-sm">{errors.captchaToken.message}</p>
          )}

          {forgotPassword.isError && (
            <Alert variant="destructive">
              <AlertDescription>{getApiErrorMessage(forgotPassword.error)}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={forgotPassword.isPending}>
            {forgotPassword.isPending ? "Sending…" : "Send reset link"}
          </Button>
        </form>

        <p className="text-center text-sm">
          <Link to="/login" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
