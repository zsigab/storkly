import { useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/api";
import { getApiErrorMessage } from "@/api/helpers";
import { Alert, AlertDescription } from "@/components/ui/alert";

function useConfirmByToken(token: string) {
  return useMutation({
    mutationFn: async () => {
      const { error } = await api.POST("/api/claims/{token}/confirm", {
        params: { path: { token } },
      });
      if (error !== undefined) throw error;
    },
  });
}

export function ConfirmClaimPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const confirm = useConfirmByToken(token);
  const called = useRef(false);

  useEffect(() => {
    if (token.length > 0 && !called.current) {
      called.current = true;
      confirm.mutate();
    }
  }, [token]);

  if (token.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Invalid link</h1>
        <p className="text-muted-foreground text-sm">This confirmation link is missing a token.</p>
        <Link to="/" className="text-primary text-sm hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  if (confirm.isPending) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-muted-foreground">Confirming your claim…</p>
      </div>
    );
  }

  if (confirm.isError) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(confirm.error)}</AlertDescription>
        </Alert>
        <Link to="/" className="text-primary text-sm hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  if (confirm.isSuccess) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Claim confirmed!</h1>
        <p className="text-muted-foreground text-sm">
          Your claim has been confirmed. If your plans change, you can un-claim below.
        </p>
        <Link to={`/un-claim?token=${token}`} className="text-destructive text-sm hover:underline">
          Un-claim this gift
        </Link>
        <div>
          <Link to="/" className="text-primary text-sm hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return <></>;
}
