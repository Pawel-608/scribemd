import { NextResponse } from 'next/server';
import { gitStatus } from '@/lib/git';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await gitStatus());
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
