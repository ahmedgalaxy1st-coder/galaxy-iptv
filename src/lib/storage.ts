import fs from 'fs';
import path from 'path';

const DEFAULT_DB = {
  settings: {
    appName: "Galaxy IPTV",
    logoUrl: "",
    backgroundUrl: "",
    whatsappNumber: "00201050501080",
    whatsappVisible: true,
    primaryColor: "#a855f7",
    streamFormat: "m3u8"
  },
  admin: { username: "admin", password: "01006240785" },
  servers: [] as any[]
};

const DB_KEY = 'galaxy_iptv_db';
const dbPath = path.join(process.cwd(), 'data', 'db.json');

// ── Local file storage (development)
function readFile() {
  try { return JSON.parse(fs.readFileSync(dbPath, 'utf-8')); }
  catch { return structuredClone(DEFAULT_DB); }
}
function writeFile(db: any) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
}

// ── Upstash Redis storage (production on Vercel)
async function readRedis() {
  const res = await fetch(
    `${process.env.UPSTASH_REDIS_REST_URL}/get/${DB_KEY}`,
    { headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` } }
  );
  const { result } = await res.json();
  return result ? JSON.parse(result) : structuredClone(DEFAULT_DB);
}

async function writeRedis(db: any) {
  await fetch(
    `${process.env.UPSTASH_REDIS_REST_URL}/set/${DB_KEY}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(JSON.stringify(db))
    }
  );
}

// ── Public API
const isProduction = !!process.env.UPSTASH_REDIS_REST_URL;

export async function getDb() {
  return isProduction ? readRedis() : readFile();
}

export async function saveDb(db: any) {
  if (isProduction) await writeRedis(db);
  else writeFile(db);
}
