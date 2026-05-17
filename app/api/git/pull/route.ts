import { NextResponse } from 'next/server';
import { git } from '@/lib/git';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await git.pull();
    return NextResponse.json({ ok: true, summary: result.summary });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
