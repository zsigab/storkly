import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getApiErrorMessage } from "@/api/helpers";
import { useGenerateInvite } from "@/hooks/useRegistries";

interface InviteLinkCardProps {
  slug: string;
  isPublic?: boolean;
}

export function InviteLinkCard({ slug, isPublic = false }: InviteLinkCardProps): React.ReactElement {
  const generateInvite = useGenerateInvite(slug);
  const publicUrl = `${window.location.origin}/r/${slug}`;
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setInviteUrl(null);
    setCopied(false);
  }, [slug]);

  const handleGenerate = (): void => {
    if (isPublic) {
      setInviteUrl(publicUrl);
      return;
    }
    generateInvite.mutate(undefined, {
      onSuccess: (data) => {
        setInviteUrl(`${publicUrl}?invite=${data.token}`);
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
