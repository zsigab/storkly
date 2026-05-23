import { useSearchParams } from "react-router";
import { GlassCardLayout } from "@/components/common/GlassCardLayout";

export function DataDeletionPage(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");

  return (
    <GlassCardLayout>
      <div className="space-y-4 text-center">
        <h1 className="text-foreground text-2xl font-semibold">Data Deletion Request</h1>
        <p className="text-muted-foreground">
          Your Facebook data deletion request has been received and processed. Your Storkly data
          associated with your Facebook account has been removed.
        </p>
        {code !== null && (
          <p className="text-muted-foreground text-sm">
            Confirmation code: <span className="text-foreground font-mono">{code}</span>
          </p>
        )}
        <p className="text-muted-foreground text-sm">
          If you have any questions, contact{" "}
          <a href="mailto:privacy@storkly.cc" className="text-primary underline">
            privacy@storkly.cc
          </a>
          .
        </p>
      </div>
    </GlassCardLayout>
  );
}
