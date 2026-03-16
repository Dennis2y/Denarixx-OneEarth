import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      organization TEXT NOT NULL,
      clearance_level INTEGER NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions(token);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS sessions_email_idx ON sessions(email);
  `);

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);
  `);

  console.log("✅ sessions table ready");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ create-sessions-table failed:", err);
  process.exit(1);
});
