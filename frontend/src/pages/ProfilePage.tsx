import { Link } from "react-router";
import { Moon, Sun } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useForgotPassword, useUpdateDisplayName } from "@/hooks/useAuthMutations";
import { useTheme, type ThemeColor, type ThemeBackground } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/common/FormField";
import { GlassCardLayout } from "@/components/common/GlassCardLayout";
import { getApiErrorMessage } from "@/api/helpers";

const COLOR_OPTIONS: { value: ThemeColor; label: string; swatch: string }[] = [
  { value: "peach", label: "Peach", swatch: "hsl(15 85% 68%)" },
  { value: "blue", label: "Blue", swatch: "hsl(217 91% 60%)" },
  { value: "pink", label: "Pink", swatch: "hsl(340 75% 64%)" },
  { value: "green", label: "Green", swatch: "hsl(160 84% 39%)" },
  { value: "purple", label: "Purple", swatch: "hsl(271 81% 56%)" },
  { value: "beige", label: "Beige", swatch: "hsl(35 50% 70%)" },
];

const BG_OPTIONS: { value: ThemeBackground; label: string }[] = [
  { value: "none", label: "Clean" },
  { value: "default", label: "Blobs" },
  { value: "stars", label: "Stars" },
  { value: "both", label: "Blobs + Stars" },
];

const displayNameSchema = z.object({
  displayName: z.string().min(1).max(100),
});

type DisplayNameFormValues = z.infer<typeof displayNameSchema>;

export function ProfilePage(): React.ReactElement {
  const { user } = useAuth();
  const updateDisplayName = useUpdateDisplayName();
  const forgotPassword = useForgotPassword();
  const { theme, setColor, setBackground, toggleMode } = useTheme();

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
            <h2 className="mb-4 text-lg font-semibold">Theme</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Color</p>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setColor(opt.value)}
                      aria-label={opt.label}
                      aria-pressed={theme.color === opt.value}
                      className="h-6 w-6 rounded-full transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{
                        backgroundColor: opt.swatch,
                        boxShadow:
                          theme.color === opt.value
                            ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${opt.swatch}`
                            : "none",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Background style</p>
                <div className="flex flex-wrap gap-1.5">
                  {BG_OPTIONS.map((opt) => (
                    <Button
                      key={opt.value}
                      type="button"
                      variant={theme.background === opt.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBackground(opt.value)}
                      aria-pressed={theme.background === opt.value}
                      className="text-xs"
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Mode</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleMode}
                  className="gap-2"
                  aria-label={
                    theme.mode === "dark" ? "Switch to light mode" : "Switch to dark mode"
                  }
                >
                  {theme.mode === "dark" ? (
                    <>
                      <Sun className="h-3.5 w-3.5" />
                      Light
                    </>
                  ) : (
                    <>
                      <Moon className="h-3.5 w-3.5" />
                      Dark
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
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
