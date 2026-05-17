import { NextResponse } from 'next/server';
import { workspaceExists, workspaceStatus } from '@/lib/workspaces';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    if (!(await workspaceExists(id))) {
      return NextResponse.json({ error: 'workspace not found' }, { status: 404 });
    }
    return NextResponse.json(await workspaceStatus(id));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
