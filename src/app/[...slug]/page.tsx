import { ClientOnly } from "../client";

export const dynamic = "force-static";

export default function CatchAllPage() {
  return <ClientOnly />;
}
