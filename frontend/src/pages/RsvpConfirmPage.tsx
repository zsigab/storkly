import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useConfirmRsvp } from "@/hooks/useRsvp";

export function RsvpConfirmPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const confirmRsvp = useConfirmRsvp();

  const confirmToken = searchParams.get("token") ?? "";

  useEffect(() => {
    if (confirmToken.length > 0) {
      confirmRsvp.mutate(confirmToken, {
        onSuccess: (data) => {
          void navigate(`/e/${data.eventId}`, { replace: true });
        },
      });
    }
  }, [confirmToken, confirmRsvp, navigate]);

  return (
    <div className="mx-auto max-w-2xl py-10 text-center">
      {confirmRsvp.isPending && <p className="text-muted-foreground">Confirming your RSVP…</p>}

      {confirmRsvp.isError && (
        <p className="text-muted-foreground">
          This confirmation link is invalid or has expired. Please try requesting a new RSVP link.
        </p>
      )}

      {!confirmRsvp.isPending && !confirmRsvp.isError && confirmToken.length === 0 && (
        <p className="text-muted-foreground">No confirmation token found.</p>
      )}
    </div>
  );
}
