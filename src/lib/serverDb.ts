import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const DATA_PATH = path.join(process.cwd(), "data", "app.db.json");
const TMP_PATH = path.join("/tmp", "app.db.json");

type DB = {
  users: any[];
  teams: any[];
  sales: any[];
  evaluation_periods: any[];
  evaluations: any[];
  notifications: any[];
};

function load(): DB {
  try {
    // On Vercel, try /tmp first (writable), then data folder
    if (fs.existsSync(TMP_PATH)) {
      return JSON.parse(fs.readFileSync(TMP_PATH, "utf-8"));
    }
    if (fs.existsSync(DATA_PATH)) {
      return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    }
  } catch {}
  return { users: [], teams: [], sales: [], evaluation_periods: [], evaluations: [], notifications: [] };
}

function save(db: DB) {
  const data = JSON.stringify(db, null, 2);
  // Try primary path, fallback to /tmp on Vercel (read-only filesystem)
  try {
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_PATH, data);
    // also keep copy in /tmp for next loads
    try { fs.writeFileSync(TMP_PATH, data); } catch {}
  } catch {
    try {
      fs.writeFileSync(TMP_PATH, data);
    } catch {}
  }
}

let seeded = false;
export async function getDB(): Promise<DB> {
  const db = load();
  if (!seeded && db.users.length === 0) {
    seeded = true;
    const adminPass = await bcrypt.hash("me011012", 10);
    const leaderPass = await bcrypt.hash("00000", 10);
    const now = Date.now();
    const admin = { id: "u1", username: "msms.ezzat@gmail.com", password: adminPass, role: "admin", name: "MS Ezzat", team_id: null, created_at: now };
    const leader = { id: "u2", username: "mahmoud.elew@gmail.com", password: leaderPass, role: "team_leader", name: "محمود", team_id: "t1", created_at: now };
    const team = { id: "t1", team_name: "فريق محمود", team_leader_id: "u2", created_at: now };
    const period = { id: "p1", name: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`, start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0], end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0], period_type: "monthly", status: "active", created_at: now };
    // sample sales
    const s1 = { id: "s1", name: "أحمد محمد", team_id: "t1", phone: "01000000001", join_date: "2025-01-15", status: "active", created_at: now };
    const s2 = { id: "s2", name: "سارة علي", team_id: "t1", phone: "01000000002", join_date: "2025-02-10", status: "active", created_at: now };
    const db2: DB = { users: [admin, leader], teams: [team], sales: [s1, s2], evaluation_periods: [period], evaluations: [], notifications: [] };
    // create draft evaluations
    for (const s of db2.sales) {
      db2.evaluations.push({
        id: `e_${s.id}_${period.id}`,
        sales_id: s.id,
        team_leader_id: "u2",
        evaluation_period: period.name,
        evaluation_period_id: period.id,
        status: "draft",
        created_at: now,
        updated_at: now,
      });
    }
    save(db2);
    return db2;
  }
  return db;
}

export function persist(db: DB) {
  save(db);
}

export function uid(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
