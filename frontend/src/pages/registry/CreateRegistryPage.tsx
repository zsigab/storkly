import { Link } from "react-router";
import { RegistryForm } from "@/components/registry/RegistryForm";
import { useCreateRegistry } from "@/hooks/useRegistries";

export function CreateRegistryPage(): React.ReactElement {
  const createRegistry = useCreateRegistry();

  return (
    <div className="mx-auto max-w-lg space-y-6 py-10">
      <div className="space-y-2">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground text-sm">
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
    </div>
  );
}
