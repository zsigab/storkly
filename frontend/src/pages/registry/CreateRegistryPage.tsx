import { Link } from "react-router";
import { RegistryForm } from "@/components/registry/RegistryForm";
import { GlassCardLayout } from "@/components/common/GlassCardLayout";
import { useCreateRegistry } from "@/hooks/useRegistries";

export function CreateRegistryPage(): React.ReactElement {
  const createRegistry = useCreateRegistry();

  return (
    <GlassCardLayout viewTransitionName="registry-new">
      <div className="space-y-1">
        <Link
          to="/dashboard"
          viewTransition
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Back to dashboard
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">Create registry</h1>
        <p className="text-muted-foreground">Set up a new gift registry for your occasion.</p>
      </div>
      <RegistryForm
        onSubmit={(values) => createRegistry.mutate(values)}
        isPending={createRegistry.isPending}
        isError={createRegistry.isError}
        error={createRegistry.error}
        submitLabel="Create registry"
      />
    </GlassCardLayout>
  );
}
