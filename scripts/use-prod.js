#!/usr/bin/env node
/**
 * Restores the app to PRODUCTION mode:
 *  - PostgreSQL database
 *  - Auth enabled (login required)
 *
 * To switch back to local mode, run:  npm run use:local
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");

console.log("🔄  Restoring PRODUCTION mode (PostgreSQL + auth)...\n");

// 1. Restore PostgreSQL schema
fs.copyFileSync(
  path.join(root, "prisma/schema.postgres.prisma"),
  path.join(root, "prisma/schema.prisma")
);
console.log("✅  Prisma schema restored to PostgreSQL");

// 2. Remove .env.local so .env values take effect again
const envLocalPath = path.join(root, ".env.local");
if (fs.existsSync(envLocalPath)) {
  fs.unlinkSync(envLocalPath);
  console.log("✅  .env.local removed (production .env is now active)");
} else {
  console.log("ℹ️  No .env.local found — already in production mode");
}

// 3. Regenerate Prisma client for PostgreSQL
console.log("\n🔄  Regenerating Prisma client for PostgreSQL...");
execSync("npx prisma generate", { stdio: "inherit", cwd: root });

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  PRODUCTION MODE RESTORED

  Database : PostgreSQL (from .env)
  Auth     : ENABLED

  Make sure your DATABASE_URL in .env
  points to a running PostgreSQL instance.

  Then run:
    npx prisma migrate dev --name init
    npm run db:seed
    npm run dev
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
