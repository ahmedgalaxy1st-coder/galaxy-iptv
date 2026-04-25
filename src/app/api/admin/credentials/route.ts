import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/storage';

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getDb();
    if (body.username) db.admin.username = body.username;
    if (body.password) db.admin.password = body.password;
    await saveDb(db);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
