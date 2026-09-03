import { NextRequest, NextResponse } from 'next/server';
import { publishDueScheduledPosts } from '@/lib/cms/publish-scheduled';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get('authorization');

  if (secret && header !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const published = await publishDueScheduledPosts({ force: true });
  return NextResponse.json({ published });
}
