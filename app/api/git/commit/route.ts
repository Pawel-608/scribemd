import { NextResponse, type NextRequest } from 'next/server';
import { git } from '@/lib/git';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { message } = (await req.json()) as { message?: string };
    const msg = (message ?? '').trim();
    if (!msg) {
      return NextResponse.json({ error: 'commit message required' }, { status: 400 });
    }
    await git.add(['notes']);
    const result = await git.commit(msg);
    return NextResponse.json({ ok: true, commit: result.commit });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
