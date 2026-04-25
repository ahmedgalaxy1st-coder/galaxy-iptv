import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const db = await getDb();
    if (db.admin.username === username && db.admin.password === password) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: 'بيانات خاطئة' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
