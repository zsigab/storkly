import { useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/api";
import { getApiErrorMessage } from "@/api/helpers";
import { Alert, AlertDescription } from "@/components/ui/alert";

function useUnclaimByToken(token: string) {
  return useMutation({
    mutationFn: async () => {
      const { error } = await api.DELETE("/api/claims/{value}", {
        params: { path: { value: token } },
      });
      if (error !== undefined) throw error;
    },
  });
}

export function UnclaimPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const unclaim = useUnclaimByToken(token);
  const called = useRef(false);

  useEffect(() => {
    if (token.length > 0 && !called.current) {
      called.current = true;
      unclaim.mutate();
    }
  }, [token]);

  if (token.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Invalid link</h1>
        <p className="text-muted-foreground text-sm">This un-claim link is missing a token.</p>
        <Link to="/" className="text-primary text-sm hover:underline">Go home</Link>
      </div>
    );
  }

  if (unclaim.isPending) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <p className="text-muted-foreground">Releasing your claim…</p>
      </div>
    );
  }

  if (unclaim.isError) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(unclaim.error)}</AlertDescription>
        </Alert>
        <Link to="/" className="text-primary text-sm hover:underline">Go home</Link>
      </div>
    );
  }

  if (unclaim.isSuccess) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Claim released</h1>
        <p className="text-muted-foreground text-sm">
          Your claim has been removed. Someone else can now gift this item.
        </p>
        <Link to="/" className="text-primary text-sm hover:underline">Go home</Link>
      </div>
    );
  }

  return <></>;
}
