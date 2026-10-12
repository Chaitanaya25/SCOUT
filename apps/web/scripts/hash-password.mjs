// Generates APP_PASSWORD_HASH (bcrypt) for the shared SCOUT password.
//
//   pnpm -C apps/web hash-password
//   pnpm -C apps/web hash-password -- "my password"     (visible in shell history; prefer the prompt)
//
// Prints two forms of the same hash:
//   1. for apps/web/.env.local  (every `$` escaped as `\$`, because Next expands `$VAR` in .env files)
//   2. for Vercel / GitHub secrets (raw, paste as-is)
import bcrypt from "bcryptjs";
import readline from "node:readline";

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      // Piped input: read one line.
      const rl = readline.createInterface({ input: process.stdin });
      rl.once("line", (line) => {
        rl.close();
        resolve(line);
      });
      rl.once("close", () => resolve(""));
      return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const out = process.stdout;
    rl._writeToOutput = (s) => {
      // Echo the prompt itself, mask everything typed afterwards.
      if (s.includes(prompt)) out.write(s);
      else if (s === "\r\n" || s === "\n") out.write(s);
    };
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
    rl.on("error", reject);
  });
}

const arg = process.argv.slice(2).find((a) => a !== "--");
const password = arg ?? (await readHidden("Shared password (input hidden): "));
if (!password || password.length < 8) {
  console.error("\nUse a password of at least 8 characters.");
  process.exit(1);
}
if (!arg) {
  const again = await readHidden("Repeat password: ");
  if (again !== password) {
    console.error("\nPasswords do not match.");
    process.exit(1);
  }
}

const hash = await bcrypt.hash(password, 12);
console.log("\nAPP_PASSWORD_HASH for apps/web/.env.local (dollar signs escaped):");
console.log(`APP_PASSWORD_HASH=${hash.replace(/\$/g, "\\$")}`);
console.log("\nAPP_PASSWORD_HASH for Vercel / other hosts (raw value):");
console.log(hash);
