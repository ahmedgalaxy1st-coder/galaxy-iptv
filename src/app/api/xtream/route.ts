import { NextRequest, NextResponse } from 'next/server';

// Proxy to forward Xtream Codes API requests server-side (avoids CORS)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const host = searchParams.get('host');
  const username = searchParams.get('username');
  const password = searchParams.get('password');
  const action = searchParams.get('action');
  const categoryId = searchParams.get('category_id');
  const streamId = searchParams.get('stream_id');
  const seriesId = searchParams.get('series_id');
  const vodId = searchParams.get('vod_id');

  if (!host || !username || !password) {
    return NextResponse.json({ error: 'Missing required params' }, { status: 400 });
  }

  // Build the Xtream API URL
  let url = `${host}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
  if (action) url += `&action=${action}`;
  if (categoryId) url += `&category_id=${categoryId}`;
  if (streamId) url += `&stream_id=${streamId}`;
  if (seriesId) url += `&series_id=${seriesId}`;  // ← كان مفقوداً - سبب مشكلة المسلسلات
  if (vodId) url += `&vod_id=${vodId}`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      // @ts-ignore
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Server responded with ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    if (err.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Connection timeout - تعذر الاتصال بالسيرفر' }, { status: 408 });
    }
    return NextResponse.json({ error: err.message || 'Proxy error' }, { status: 502 });
  }
}
