import { NextResponse, type NextRequest } from 'next/server';
import { renameNote, workspaceExists } from '@/lib/workspaces';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!(await workspaceExists(id))) {
      return NextResponse.json({ error: 'workspace not found' }, { status: 404 });
    }
    const { from, to } = (await req.json()) as { from?: string; to?: string };
    if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
      return NextResponse.json({ error: '"from" and "to" are required' }, { status: 400 });
    }
    await renameNote(id, from, to);
    return NextResponse.json({ ok: true, from, to });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
