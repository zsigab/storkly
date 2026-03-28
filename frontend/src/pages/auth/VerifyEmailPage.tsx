import { useEffect } from "react";
import { useSearchParams, Link } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getApiErrorMessage } from "@/api/helpers";
import { useVerifyEmail } from "@/hooks/useAuthMutations";

export function VerifyEmailPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const verify = useVerifyEmail();

  useEffect(() => {
    if (token !== null && token.length > 0) {
      verify.mutate(token);
    }
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (token === null || token.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Invalid link</h1>
        <p className="text-muted-foreground">This verification link is missing a token.</p>
        <Link to="/login" className="text-primary text-sm hover:underline">
          Return to sign in
        </Link>
      </div>
    );
  }

  if (verify.isPending) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-muted-foreground">Verifying your email…</p>
      </div>
    );
  }

  if (verify.isError) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Verification failed</h1>
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(verify.error)}</AlertDescription>
        </Alert>
        <Link to="/login" className="text-primary text-sm hover:underline">
          Return to sign in
        </Link>
      </div>
    );
  }

  if (verify.isSuccess) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Email verified!</h1>
        <p className="text-muted-foreground">Your account is now active. You can sign in.</p>
        <Link to="/login" className="text-primary text-sm hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-muted-foreground">Verifying…</p>
    </div>
  );
}
