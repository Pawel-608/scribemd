import { NextResponse } from 'next/server';
import { commitDetail, workspaceExists } from '@/lib/workspaces';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string; sha: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id, sha } = await params;
    if (!(await workspaceExists(id))) {
      return NextResponse.json({ error: 'workspace not found' }, { status: 404 });
    }
    return NextResponse.json(await commitDetail(id, sha));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
