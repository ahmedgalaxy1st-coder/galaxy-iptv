import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/storage';

export async function GET() {
  try {
    const db = await getDb();
    return NextResponse.json(db.settings);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getDb();
    db.settings = { ...db.settings, ...body };
    await saveDb(db);
    return NextResponse.json({ success: true, settings: db.settings });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
