// Generates a random SESSION_SECRET (32 bytes, base64url ≈ 43 characters).
//
//   pnpm -C apps/web gen-secret
//
// Put it in apps/web/.env.local (and in Vercel) as SESSION_SECRET. Changing it signs everyone out.
import { randomBytes } from "node:crypto";

console.log(`SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
