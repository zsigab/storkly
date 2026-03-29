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
    <div className="space-y-2">
      {inviteUrl === null && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generateInvite.isPending}
        >
          {generateInvite.isPending ? "Generating…" : "Get invite link"}
        </Button>
      )}
      {inviteUrl !== null && (
        <div className="flex gap-2">
          <Input value={inviteUrl} readOnly className="h-9 text-xs" />
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      )}
      {generateInvite.isError && (
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(generateInvite.error)}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
