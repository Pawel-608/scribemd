import { NextResponse, type NextRequest } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { resolveNote } from '@/lib/notes';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ path: string[] }> };

function fail(err: unknown, status = 400) {
  return NextResponse.json({ error: (err as Error).message }, { status });
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { path: segments } = await params;
    const rel = segments.join('/');
    const full = resolveNote(rel);
    const content = await fs.readFile(full, 'utf8');
    return NextResponse.json({ path: rel, content });
  } catch (err) {
    return fail(err);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { path: segments } = await params;
    const rel = segments.join('/');
    const full = resolveNote(rel);
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
    const { path: segments } = await params;
    const rel = segments.join('/');
    const full = resolveNote(rel);
    await fs.unlink(full);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail(err);
  }
}
