import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string | undefined;
  children: ReactNode;
}

export function FormField({ label, htmlFor, error, children }: FormFieldProps): React.ReactElement {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error !== undefined && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
