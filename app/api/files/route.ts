import { NextResponse } from 'next/server';
import { ensureNotesDir, listMarkdown } from '@/lib/notes';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureNotesDir();
    const files = await listMarkdown();
    return NextResponse.json({ files });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
