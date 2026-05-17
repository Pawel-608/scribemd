import { NextResponse, type NextRequest } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { resolveNote, workspaceExists } from '@/lib/workspaces';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string; path: string[] }> };

function fail(err: unknown, status = 400) {
  return NextResponse.json({ error: (err as Error).message }, { status });
}

async function guard(id: string) {
  if (!(await workspaceExists(id))) {
    throw new Error('workspace not found');
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id, path: segments } = await params;
    await guard(id);
    const rel = segments.join('/');
    const full = resolveNote(id, rel);
    const content = await fs.readFile(full, 'utf8');
    return NextResponse.json({ path: rel, content });
  } catch (err) {
    return fail(err);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id, path: segments } = await params;
    await guard(id);
    const rel = segments.join('/');
    const full = resolveNote(id, rel);
    const body = (await req.json()) as { content?: string };
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, body.content ?? '', 'utf8');
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id, path: segments } = await params;
    await guard(id);
    const rel = segments.join('/');
    const full = resolveNote(id, rel);
    await fs.unlink(full);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
