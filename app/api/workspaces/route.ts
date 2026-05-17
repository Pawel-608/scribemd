import { NextResponse } from 'next/server';
import { createWorkspace } from '@/lib/workspaces';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const id = await createWorkspace();
    return NextResponse.json({ id });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
