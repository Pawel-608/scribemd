import { NextResponse, type NextRequest } from 'next/server';
import { commitWorkspace, workspaceExists } from '@/lib/workspaces';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    if (!(await workspaceExists(id))) {
      return NextResponse.json({ error: 'workspace not found' }, { status: 404 });
    }
    const body = (await req.json().catch(() => ({}))) as { message?: string };
    const message = (body.message ?? '').trim() || 'Update';
    const result = await commitWorkspace(id, message);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
