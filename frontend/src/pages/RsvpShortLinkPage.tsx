import { useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useRsvpShortLink } from "@/hooks/useEvents";

export function RsvpShortLinkPage(): React.ReactElement {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const safeCode = code ?? "";
  const { data, isPending, isError } = useRsvpShortLink(safeCode);

  useEffect(() => {
    if (data?.rsvpToken !== undefined) {
      navigate(`/rsvp/${data.rsvpToken}`, { replace: true });
    }
  }, [data, navigate]);

  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="text-muted-foreground">Link not found or expired.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-10 text-center">
      <p className="text-muted-foreground">Redirecting…</p>
    </div>
  );
}
