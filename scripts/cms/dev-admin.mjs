// Local development with the blog admin open without signing in:
//   npm run dev:admin                      (http://<Npcap loopback address>:3000/admin-blog, or 127.0.0.1 without it)
//   npm run dev:admin -- --host 127.0.0.1 --port 3000
//
// What it does, and nothing else:
// - starts `next dev` with CMS_DEV_ACCESS=1 (see cms/server/auth/dev-access.ts), which only works under next dev;
// - uses the local test database (mongodb://127.0.0.1:27018, blog_cms_local_test), never Atlas or blog_cms;
// - keeps new images in the local folder (CMS_IMAGES=local), never Cloudinary;
// - listens only on an address other computers cannot reach (loopback, or the Npcap loopback adapter).
// Start the local database first: in customs-wise-blog-cms-local, `npm run mongo:local`.
// Plain `npm run dev` is unchanged and still asks for a sign-in.
import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import { networkInterfaces } from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const stop = (message) => {
  console.error(message);
  process.exit(1);
};

/** The address of the Npcap Loopback Adapter (installed with Nmap): a virtual adapter no other computer can reach. */
function npcapLoopback() {
  for (const [name, addrs] of Object.entries(networkInterfaces())) {
    if (!/npcap loopback/i.test(name)) continue;
    const v4 = addrs?.find((a) => a.family === "IPv4" && a.address.startsWith("169.254."));
    if (v4) return v4.address;
  }
  return null;
}

const npcap = npcapLoopback();
const host = opt("host") ?? npcap ?? "127.0.0.1";
const port = opt("port") ?? "3000";
const localOnly = host === "localhost" || host === "::1" || /^127\./.test(host) || (npcap !== null && host === npcap);
if (!localOnly) stop(`--host ${host} could be reachable from other computers. Use 127.0.0.1${npcap ? ` or ${npcap}` : ""}.`);
if (!/^\d{2,5}$/.test(port)) stop("--port must be a number.");

const DB_HOST = "127.0.0.1";
const DB_PORT = 27018;
const reachable = await new Promise((resolve) => {
  const socket = createConnection({ host: DB_HOST, port: DB_PORT, timeout: 1500 });
  socket.once("connect", () => (socket.destroy(), resolve(true)));
  socket.once("error", () => resolve(false));
  socket.once("timeout", () => (socket.destroy(), resolve(false)));
});
if (!reachable) stop(`The local test database is not running on ${DB_HOST}:${DB_PORT}. Start it in customs-wise-blog-cms-local with: npm run mongo:local`);

console.log(`\nBlog admin without sign-in (local development only)`);
console.log(`  open      http://${host.includes(":") ? `[${host}]` : host}:${port}/admin-blog`);
console.log(`  database  local test database (blog_cms_local_test), not the live blog_cms`);
console.log(`  images    local folder, not Cloudinary\n`);

const next = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [next, "dev", "-H", host, "-p", port], {
  stdio: "inherit",
  env: {
    ...process.env,
    // Set here, so they win over .env / .env.local (Next.js never overrides variables that are already set).
    CMS_DEV_ACCESS: "1",
    MONGODB_URI: `mongodb://${DB_HOST}:${DB_PORT}`,
    MONGODB_DB: "blog_cms_local_test",
    CMS_IMAGES: "local",
  },
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
