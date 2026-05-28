import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useConfirmRsvp } from "@/hooks/useRsvp";

export function RsvpConfirmPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { mutate: confirm, isPending, isError } = useConfirmRsvp();

  const confirmToken = searchParams.get("token") ?? "";

  useEffect(() => {
    if (confirmToken.length > 0) {
      confirm(confirmToken, {
        onSuccess: (data) => {
          void navigate(`/e/${data.eventId}`, { replace: true });
        },
      });
    }
  }, [confirmToken, confirm, navigate]);

  return (
    <div className="mx-auto max-w-2xl py-10 text-center">
      {isPending && <p className="text-muted-foreground">Confirming your RSVP…</p>}

      {isError && (
        <p className="text-muted-foreground">
          This confirmation link is invalid or has expired. Please try requesting a new RSVP link.
        </p>
      )}

      {!isPending && !isError && confirmToken.length === 0 && (
        <p className="text-muted-foreground">No confirmation token found.</p>
      )}
    </div>
  );
}
