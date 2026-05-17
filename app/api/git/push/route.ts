import { NextResponse } from 'next/server';
import { git } from '@/lib/git';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await git.push();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
