import { ClientOnly } from '../client';

export const dynamic = 'force-dynamic';

export default function CatchAllPage() {
  return <ClientOnly />;
}
