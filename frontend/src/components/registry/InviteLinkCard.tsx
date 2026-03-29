import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getApiErrorMessage } from "@/api/helpers";
import { useGenerateInvite } from "@/hooks/useRegistries";

interface InviteLinkCardProps {
  slug: string;
}

export function InviteLinkCard({ slug }: InviteLinkCardProps): React.ReactElement {
  const generateInvite = useGenerateInvite(slug);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = (): void => {
    generateInvite.mutate(undefined, {
      onSuccess: (data) => {
        setInviteUrl(`${window.location.origin}/r/${slug}?invite=${data.token}`);
      },
    });
  };

  const handleCopy = (): void => {
    if (inviteUrl === null) return;
    void navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border-border rounded-lg border p-4 space-y-3">
      <h3 className="font-semibold text-sm">Invite link</h3>
      {inviteUrl !== null ? (
        <>
          <div className="flex gap-2">
            <Input value={inviteUrl} readOnly className="text-xs" />
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generateInvite.isPending}
          >
            Generate new link
          </Button>
        </>
      ) : (
        <Button variant="outline" onClick={handleGenerate} disabled={generateInvite.isPending}>
          {generateInvite.isPending ? "Generating…" : "Get invite link"}
        </Button>
      )}
      {generateInvite.isError && (
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(generateInvite.error)}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
