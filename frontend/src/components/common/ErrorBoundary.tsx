import React from "react";
import { Button } from "@/components/ui/button";
import { GlassCardLayout } from "@/components/common/GlassCardLayout";

function ErrorFallback(): React.ReactElement {
  return (
    <div className="bg-background text-foreground flex min-h-screen items-center justify-center p-4">
      <GlassCardLayout>
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-destructive text-5xl font-bold">Oops</p>
            <h1 className="text-foreground text-2xl font-semibold">Something went wrong</h1>
            <p className="text-muted-foreground">
              An unexpected error occurred. Please refresh the page.
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>Refresh page</Button>
        </div>
      </GlassCardLayout>
    </div>
  );
}

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(_error: Error): State {
    return { hasError: true };
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
