import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { can } from '@/lib/auth/session';
import { listMedia } from '@/lib/queries/admin';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !can(session.user, 'admin.access')) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const items = await listMedia();
  return Response.json({ items });
}
