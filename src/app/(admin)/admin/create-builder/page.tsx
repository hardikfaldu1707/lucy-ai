import { getAdminCreationConfig } from "@/lib/data/character-creation-config";
import { CreateBuilderClient } from "./create-builder-client";

export const dynamic = "force-dynamic";

export default async function CreateBuilderPage() {
  const config = await getAdminCreationConfig();

  return <CreateBuilderClient initialConfig={config} />;
}
