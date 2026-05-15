import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useForgotPassword, useUpdateDisplayName } from "@/hooks/useAuthMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/common/FormField";
import { GlassCardLayout } from "@/components/common/GlassCardLayout";
import { getApiErrorMessage } from "@/api/helpers";

const displayNameSchema = z.object({
  displayName: z.string().min(1).max(100),
});

type DisplayNameFormValues = z.infer<typeof displayNameSchema>;

export function ProfilePage(): React.ReactElement {
  const { user } = useAuth();
  const updateDisplayName = useUpdateDisplayName();
  const forgotPassword = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DisplayNameFormValues>({
    resolver: zodResolver(displayNameSchema),
    defaultValues: { displayName: user?.displayName ?? "" },
  });

  if (!user) {
    return <div>Not authenticated</div>;
  }

  const onSubmitDisplayName = ({ displayName }: DisplayNameFormValues): void => {
    updateDisplayName.mutate(displayName, {
      onSuccess: () => {
        reset({ displayName });
      },
    });
  };

  const onSendPasswordReset = (): void => {
    forgotPassword.mutate(user.email);
  };

  return (
    <GlassCardLayout viewTransitionName="profile">
      <div className="space-y-1">
        <Link
          to="/dashboard"
          viewTransition
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Back to dashboard
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
          <Link to="/my-claims" className="text-primary text-sm hover:underline">
            My claims
          </Link>
        </div>
      </div>

      <div>
        <div className="mb-8 space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <p className="text-muted-foreground mt-1">{user.email}</p>
          </div>
        </div>

        <div className="space-y-6 border-t pt-6">
          <div>
            <h2 className="mb-4 text-lg font-semibold">Change display name</h2>
            <form className="space-y-4" noValidate onSubmit={handleSubmit(onSubmitDisplayName)}>
              <FormField
                label="Display name"
                htmlFor="displayName"
                error={errors.displayName?.message}
              >
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  {...register("displayName")}
                />
              </FormField>

              {updateDisplayName.isSuccess && (
                <Alert>
                  <AlertDescription>Display name updated successfully!</AlertDescription>
                </Alert>
              )}

              {updateDisplayName.isError && (
                <Alert variant="destructive">
                  <AlertDescription>{getApiErrorMessage(updateDisplayName.error)}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={updateDisplayName.isPending}>
                {updateDisplayName.isPending ? "Saving…" : "Save"}
              </Button>
            </form>
          </div>

          <div className="border-t pt-6">
            <h2 className="mb-4 text-lg font-semibold">Change password</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              We'll send you an email with a link to reset your password.
            </p>

            {forgotPassword.isSuccess && (
              <Alert>
                <AlertDescription>
                  {`If that address is registered, we've sent a password reset link.`}
                </AlertDescription>
              </Alert>
            )}

            {forgotPassword.isError && (
              <Alert variant="destructive">
                <AlertDescription>{getApiErrorMessage(forgotPassword.error)}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={onSendPasswordReset}
              disabled={forgotPassword.isPending}
              variant={forgotPassword.isSuccess ? "outline" : "default"}
            >
              {forgotPassword.isPending ? "Sending…" : "Send password reset link"}
            </Button>
          </div>
        </div>
      </div>
    </GlassCardLayout>
  );
}
