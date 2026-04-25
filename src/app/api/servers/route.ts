import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/storage';

export async function GET() {
  try {
    const db = await getDb();
    return NextResponse.json(db.servers);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getDb();
    const newServer = { id: Date.now(), name: body.name || 'سيرفر جديد', code: body.code, host: body.host };
    db.servers.push(newServer);
    await saveDb(db);
    return NextResponse.json({ success: true, server: newServer });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const db = await getDb();
    db.servers = db.servers.filter((s: any) => s.id !== id);
    await saveDb(db);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
