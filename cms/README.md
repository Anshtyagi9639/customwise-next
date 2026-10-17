# Blog admin (/admin-blog)

The blog CMS runs inside the Customs Wise website: the admin is at **https://customswise.ie/admin-blog**, served by the same Node.js app as the website. There is no separate CMS website or subdomain.

The code came from the separate `customs-wise-blog-cms` repository (the multi-site prototype). This folder is now the version that is deployed; the other repository is a reference copy.

## What is where

| Path | What it is |
| --- | --- |
| `cms/` | The CMS: records and rules (`server/`), editor and preview components (`components/`), shared types and helpers (`lib/`) |
| `app/admin-blog/` | The admin: sign-in page, dashboard, account, per-website screens, and its API (`app/admin-blog/api/`) |
| `app/api/public/v1/sites/{site}/...` | Read-only public API (published articles only), for other websites in the CMS |
| `app/media/[site]/[file]` | Images uploaded with `CMS_IMAGES=local` (local tests only) |
| `proxy.ts` | Early redirect and security headers for `/admin-blog`; sends unknown `/insights/blog/...` addresses to the 404 page |
| `lib/content/blog-source.ts` | Where the public blog gets its articles (`BLOG_SOURCE`) |
| `scripts/cms/` | Account tool, image re-link, tests |

The public pages only use `lib/content/blog-source.ts`, which loads the CMS's read code only when `BLOG_SOURCE=cms`.

## Websites

The admin manages one website, Customs Wise (`ENABLED_SITE_KEYS` in `cms/lib/routes.ts`). Databases created before the demo website was removed still contain its record ("Demo Website", `demo-website`) with 2 fictional articles. It is left untouched but hidden everywhere: not on the dashboard, not in any list or selector, and its admin and public addresses answer 404 (`cms/server/sites.ts`). It can be deleted from the database later; that is a separate, deliberate change.

## Settings

Server-side environment variables (never `NEXT_PUBLIC_`). Locally in `.env.local`, in production in the hosting panel. Never commit them.

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | Atlas connection string. Use a database user with `readWrite` on `MONGODB_DB` only. |
| `MONGODB_DB` | `blog_cms` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | From Cloudinary, Settings > API Keys |
| `BLOG_SOURCE` | `static` (default): the public blog shows the built-in articles in `lib/content/blog-posts.ts`. `cms`: it shows the articles published in the admin. |

`CMS_PUBLIC_URL` is not needed: image addresses use `NEXT_PUBLIC_SITE_URL`. No session secret is needed either: sessions are random tokens stored (hashed) in MongoDB, not signed cookies. `CMS_STORE=json` and `CMS_IMAGES=local` exist for local tests only.

The admin always needs MongoDB. If the database is not configured or cannot be reached, the admin says so; it never falls back to a local file.

## Signing in with an email link

With `ADMIN_EMAIL` set, the sign-in page shows one button, **Email me a sign-in link**. Nobody types an address: the link always goes to `ADMIN_EMAIL`, and nobody else can receive one. Opening the link signs in and opens Manage Customs Wise. The password form is still there, under "Sign in with a password instead", for accounts that have one.

- **The link:** works once and expires after 15 minutes. Asking for a new one cancels the previous one, and so does changing `ADMIN_EMAIL`. It contains a random token after `#`, so the token never reaches a server log or the requests mail scanners make. Only the token's SHA-256 hash is kept, in the server's memory, so a restart cancels unused links. An expired or used link shows a message with **Email me a new sign-in link**.
- **The session** is the same as for a password sign-in: HttpOnly, SameSite=Strict, Secure on HTTPS, 2 hours idle / 12 hours at most, ended by sign-out (`env-sessions.ts`). No database is needed to sign in this way.
- **Limits:** 5 link emails per IP address and 10 in all per 15 minutes, and 20 failed link uses per IP address. Someone could use up the 10 on purpose, which blocks new links for 15 minutes; the password option still works.
- **Where the link points:** never taken from the incoming request in production (a forged Host header cannot redirect it). It uses `CMS_PUBLIC_URL`, otherwise `NEXT_PUBLIC_SITE_URL`. Under `npm run dev`, it is the local address the page was opened at (`localhost`, `127.x` or `169.254.x.x`).
- **Email delivery:** Resend, with the website's `EMAIL_API_KEY` and `EMAIL_FROM`. The server log records "Sign-in link emailed to c•••@…: accepted by the provider (id …)" or why Resend refused it, never the link.
  - **"Accepted" is not "delivered".** A sending-only API key cannot see what happened next. Check Resend → Emails, or add a full-access key as `RESEND_READ_API_KEY` in `.env` (never in Git). The server then logs the delivery status about 30 seconds after each send, and `npm run cms:email-status -- <id>` shows it on demand.
  - **Resend's test sender (`@resend.dev`) only delivers to the address that owns the Resend account.** For links to reach `ADMIN_EMAIL`, verify the website's domain in Resend (Domains → add `customswise.ie`, then add the DNS records it shows) and set `EMAIL_FROM` to an address on it, for example `Customs Wise CMS <cms@customswise.ie>`.

### Diagnosing sign-in on the live server

**Health check:** open `/admin-blog/api/health`. It is public, so it shows names and statuses only, never a value:

- `database`: whether MongoDB answered. If not, `reason` (`not-configured` or `unreachable`) and `kind`, for example `network-access` (add the server's IP in Atlas → Network Access), `authentication` (user name or password in `MONGODB_URI`) or `dns`.
- `settings.missing`: required settings that are not set, by name.
- `emailSignIn`: whether `ADMIN_EMAIL`, `EMAIL_API_KEY`, the sender and the link address are usable. `sender` says if it is Resend's test sender.
- `signInStore`: whether sign-in records can be written.
- `blogSource`.

The health check never sends an email.

**Server log (Hostinger → the Node.js app → Logs):** sign-in and the database write one line per step, in this format:

```text
2026-10-16T13:04:19.546Z [CMS_AUTH] email_provider_accepted rid=7ce6cd42a8ba env=production outcome=success attempt=267d66d6482e status=200 ms=19 provider_id=… msg="…"
```

- `rid` is one request. It is also returned to the browser and shown as "Reference" when sending fails.
- `attempt` is one login attempt: the same id appears when the link is emailed and when it is used.

The events of one request, in order:

1. Sending a link: `request_received`, `email_validation`, `configuration_check`, `token_created`, `token_persisted`, `email_send_started`, then `email_provider_accepted` or `email_send_failed` (with `code`), then `request_completed`.
2. Using a link: `verification_started`, then `token_consumed` or `token_validation_failed`, then `session_created`, `session_cookie_set`, `dashboard_redirect`.
3. Afterwards: `dashboard_load_failed` (signed in, but the database could not be read), `auth_store_failed` (sign-in records could not be written), and `[CMS_DB] connection_started` / `connection_succeeded` / `connection_failed`. A repeated database failure is logged at most once a minute.

`token_validation_failed` says why a link did not work:

| `code` | Meaning |
|---|---|
| `missing` | No token was sent |
| `malformed` | The token has the wrong shape |
| `unknown` | Never issued, or its email was not sent |
| `already_used` | The link was used before |
| `replaced` | A newer email was sent |
| `expired` | Older than 15 minutes |
| `admin_changed` | `ADMIN_EMAIL` changed since the link was sent |

Accepted is not delivered: `email_provider_accepted` only means Resend took the email. With `RESEND_READ_API_KEY` set, an `email_delivery_status` line follows about 30 seconds later (`delivered`, `bounced`, `suppressed`, `delivery_delayed`, …).

Never logged: tokens, sign-in links, session ids, cookies, API keys, connection strings, passwords, or a full email address (addresses are masked). Every value is screened before it is written.

**Where sign-in records live:** sign-in links and sessions are small files in `CMS_AUTH_DIR`, by default `.cms-data/auth` in the app folder.

- They survive restarts, and every process on the same server shares them.
- If a deployment replaces the app folder, open sessions and unused links end; signing in again fixes it.
- To keep them across deployments, set `CMS_AUTH_DIR` to a folder outside the app folder that the Node.js process can write.
- They are not shared between different machines. If the website ever runs on several machines, they need a shared folder.

`CMS_EMAIL_TIMEOUT_MS` (10000 by default) is how long Resend has to answer. After a timeout the link is kept, because the email may still arrive.

### Getting sign-in emails into the Inbox (not Spam)

What is known (checked on 16 October 2026):

- The sender is Resend's shared test address, `onboarding@resend.dev`, shown as "Customs Wise Website". Resend delivers it only to the address that owns the Resend account. Its domain is authenticated by Resend (`_dmarc.resend.dev` is `p=reject`), but it is shared by everyone who tests with Resend. A Customs Wise name on an unrelated domain is also a common spam signal.
- `customswise.ie` has not been set up in Resend: there is no `resend._domainkey.customswise.ie` (DKIM) and no `send.customswise.ie` (Resend's return path) in DNS. It also has no DMARC record (`_dmarc.customswise.ie`). Its existing SPF record covers Microsoft 365, TopSec and Salesforce only, which is right for its normal email; Resend uses its own `send.` subdomain, so that record does not need changing.

What actually happened to a given email can be checked without guessing:

- **Authentication:** save the email from Gmail (⋮ → "Download message"), then `npm run cms:email-headers -- path/to/message.eml`. It shows the real SPF, DKIM and DMARC results and whether they align with the sender. It reads the file only; tokens and full addresses are never printed.
- **Delivery events:** `npm run cms:email-status -- <id>`, with a full-access key as `RESEND_READ_API_KEY`. Delivered means the mail server took it; it does not say Inbox or Spam.

To move sign-in emails to your own domain:

1. In Resend → Domains → Add domain, enter `customswise.ie`. Resend then shows the exact DNS records to add. They are unique to your account, so copy them from Resend: typically a DKIM record at `resend._domainkey`, and an MX and an SPF (TXT) record at `send` (the return path).
2. Add them at the DNS provider of `customswise.ie`, exactly as shown, and press Verify in Resend. Do not change the existing SPF record of `customswise.ie` itself.
3. Add a DMARC record if the domain has none, starting by only monitoring: `_dmarc.customswise.ie TXT "v=DMARC1; p=none; rua=mailto:<an address that receives reports>"`. Tighten it later, once reports show that all your legitimate email (Microsoft 365, TopSec, Salesforce, Resend) passes.
4. When Resend shows the domain as Verified, set `CMS_EMAIL_FROM=Customs Wise CMS <cms@customswise.ie>` (locally in `.env`, on the live site in hPanel) and restart. Until then, leave it unset: sending from an unverified domain is refused by Resend.
5. Optional, once the domain sends regularly: Google Postmaster Tools (postmaster.google.com) shows Gmail's view of the domain's reputation and authentication. It only shows data for domains that send a reasonable volume to Gmail, so it may stay empty for a handful of sign-in emails.

The email itself is a short transactional message: a factual subject, the website and time of the request, the link (as a button and as text), why it was sent, no images, tracking or marketing. Its text and HTML parts say the same thing, and each email has a unique reference header so Gmail does not thread them together. On the live site, links always use the `https://` address in `CMS_PUBLIC_URL` (or `NEXT_PUBLIC_SITE_URL`); a local or `http` address there switches sign-in emails off rather than emailing an unusable link. Locally (`npm run dev`), links point to the local address, which spam filters may find odd: expect local test emails to fare worse than live ones.

| Setting | Local (`.env`) | Live website (hPanel → Environment variables) |
| --- | --- | --- |
| `ADMIN_EMAIL` | The administrator's address | The same |
| `EMAIL_API_KEY`, `EMAIL_FROM` | Already set for the enquiry form | The same, with `EMAIL_FROM` on the verified domain |
| `CMS_PUBLIC_URL` | Not needed | `https://customswise.ie` (otherwise links use `NEXT_PUBLIC_SITE_URL`, `https://www.customswise.ie`, which also works) |
| `ADMIN_PASSWORD_HASH` | Optional: only for the password option | Optional |
| `CMS_EMAIL_FROM` | Leave unset until the domain is verified | `Customs Wise CMS <cms@customswise.ie>` once Resend shows `customswise.ie` as Verified (sign-in emails only; `EMAIL_FROM` stays for the enquiry form) |

Tests: `npm run cms:test:email-link` (after `npm run build`). It runs a fake email provider on this computer, so no real email is sent and no database is needed.

## Administrator from the server settings

The usual way to set up the administrator. Two settings define it; there is no sign-up page.

| Setting | Value |
| --- | --- |
| `ADMIN_EMAIL` | The administrator's email address |
| `ADMIN_PASSWORD_HASH` | A scrypt hash of the password, written by `npm run cms:admin-env`. Never the password itself. |

**Locally:**

```
npm run cms:admin-env -- --email you@example.com
```

It asks for the password twice without showing it (at least 12 characters), and writes both settings to `.env` (git-ignored; only those two lines are added or replaced, nothing else in the file changes; the script refuses any file Git would commit). Nothing secret is printed. Restart `npm run dev`, then sign in at `/admin-blog`.

**On the hosting (Hostinger):** run `npm run cms:admin-env -- --email you@example.com --print` on your computer. It prints the two lines instead of saving them. Add them as environment variables in the hosting panel (Node.js app → Environment variables), then restart the app. Do not put them in a file in the repository.

How it works (`cms/server/auth/env-admin.ts`, `env-sessions.ts`):

- **Sign-in needs only the settings.** The email and password are checked against `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH`. MongoDB is not used and no database account is created, so this administrator can sign in while the database cannot be reached.
- **Its sessions are kept in the server's memory.** The browser holds a random token and only its SHA-256 hash is kept. Same limits as database sessions: 2 hours idle, 12 hours at most, ended on sign-out. They also end when the server restarts, and when either setting changes or is removed. **Limitation:** memory belongs to one server process. On hosting that runs several processes at once, a session would only be recognised by the process that created it.
- **Its rate limit is in memory too.** 5 failures per email or 20 per IP lock for 15 minutes, as for database accounts. The lock is also cleared by a restart.
- **The rest of the CMS still needs the database.** Articles, categories, authors, images, Users and the activity log all live in MongoDB. While it is unreachable, this administrator is signed in but those screens show "This screen could not be loaded", with a Sign out button. Changes by this administrator are recorded in the activity log under `ADMIN_EMAIL`, once the database is reachable.
- **Revoking access:** remove or change the settings and restart; that ends every one of its sessions. It is not listed under Users, and `cms:admin disable`/`sign-out` do not apply to it.
- **Changing its password:** run `cms:admin-env` again and restart. The CMS refuses to change it in **Account**, by a reset link or with `cms:admin set-password`.
- **Every other account uses the database as before:** stored hash, database sessions, disabling, Users. If the database cannot be reached, those accounts get "Sign-in is not available… the CMS database cannot be reached", never "Invalid email or password.".
- **Hash format:** written as `scrypt:N:r:p:salt:hash`. A `scrypt$...` value would be damaged inside a `.env` file, because Next.js reads `$NAME` there as a variable.
- **Incomplete settings switch sign-in off.** Only one of the two settings, or a damaged hash, gives everyone a general "problem with the server's settings" message; the server log names the setting without its value. With neither setting, sign-in uses the database accounts only.

## First administrator (command line)

The alternative to the settings above, for example for more administrators or when the settings are not used. The first administrator is created on a computer with database access, with `MONGODB_URI` and `MONGODB_DB` in `.env.local` and that computer's IP allowed in Atlas Network Access.

1. Check which database the tool would change. This changes nothing and prints only the server address and database name, never the user name or password:

   ```
   npm run cms:admin -- check
   ```

   It should say `Database: blog_cms on <your cluster>.mongodb.net`, and list the websites. If it says `127.0.0.1` or another database name, stop and fix `.env.local`.

2. Create the account:

   ```
   npm run cms:admin -- create --email you@example.com --name "Your Name"
   ```

   The tool shows the database again and asks you to type its name to continue. Then it asks for the password twice, without showing it (at least 12 characters). The password is never on the command line, in a file or in the output.

3. Sign in at `/admin-blog`.

Locally, `npm run dev` works at **http://localhost:3000/admin-blog** and at the "Network" address it prints (such as `http://169.254.x.x:3000`). Under `next dev` only, the session cookie is a plain `cw_admin_dev` cookie (HttpOnly, SameSite=Strict, not Secure), because browsers drop Secure cookies on a plain `http://` address other than localhost. `next.config.mjs` lists this computer's `169.254.x.x` addresses in `allowedDevOrigins`; otherwise the dev server blocks its own scripts there and the page never becomes interactive. Production builds always use the `__Secure-cw_admin` cookie with Secure, and a production build opened over plain `http://` (other than localhost) says so instead of signing in.

Other commands: `list`, `set-password`, `disable`, `enable`, `unlock`, `sign-out`. See the top of `scripts/cms/admin-users.mjs`. Every command that changes something asks for the database name first (or `--confirm-db <name>` when there is no terminal).

## Local development without sign-in

For working on the admin on this computer, `npm run dev:admin` starts `next dev` with the admin open without signing in, as a stand-in administrator ("Local development access" in the top bar):

```
cd ../customs-wise-blog-cms-local && npm run mongo:local     (the local test database, in its own terminal)
npm run dev:admin                                            (then open http://169.254.191.165:3000/admin-blog)
```

- It uses the local test database (`blog_cms_local_test`) and the local image folder, never Atlas, `blog_cms` or Cloudinary.
- It listens only on the Npcap loopback address (or `127.0.0.1`), which other computers cannot reach.
- Every article, category, author, setting and invitation works; changes are recorded in the audit log as `local-dev@localhost`. There is no account, so Account and Sign out are hidden.
- It cannot be switched on from a browser (no URL, header or cookie does it), by plain `npm run dev`, with `blog_cms` or an Atlas address, for `customswise.ie`, or in a production build: there `cms/server/auth/dev-access.ts` is compiled to "always off".

## Adding people (invitations)

An administrator opens **Users** (top bar; administrators only) and fills in **Invite someone**: email, name, and a role.

- **Editor:** articles and categories, on the websites ticked.
- **Administrator:** everything, including authors, website settings and Users.

The CMS shows a one-time link (`/admin-blog/setup#…`). Send it to the person privately. It is shown once; only its hash is stored. The person opens it, sees which email it is for, and chooses their own password. Administrators never see or set other people's passwords. An invitation link expires after 72 hours; **New invitation link** replaces it, and **Withdraw** removes an unused invitation.

From **Users** an administrator can also **Disable** (and later **Enable**) an account, which signs it out at once, or **Sign out** a person everywhere. You cannot disable your own account, so there is always at least one active administrator. Accounts are never deleted, so the audit log keeps its authors. Every action is in the audit log.

## Forgotten password (recovery)

There is no email reset, and nothing can be reset from the sign-in page.

- **Anyone with an administrator:** the administrator opens **Users** and clicks **Reset password** for the person, which gives a one-time link (valid 24 hours). Using it sets the new password, ends every session of that account and cancels any other link.
- **The only administrator, or nobody can sign in:** someone with database access runs `npm run cms:admin -- set-password --email you@example.com`. This also ends every session and clears any sign-in lock.

## Security

- **Passwords:** scrypt (Node.js built-in crypto, OWASP parameters), never stored or returned in plain text. Unknown accounts take as long to reject as wrong passwords, and get the same message.
- **Sessions:** random token in an HttpOnly, Secure, SameSite=Strict cookie limited to `/admin-blog`; only its hash is stored. Sessions end after 2 hours idle or 12 hours, on sign-out, on password change and when an account is disabled.
- **Brute force:** 5 failures per email or 20 per IP within 15 minutes lock that email or IP for 15 minutes (stored in MongoDB). Wrong or expired setup links count towards the same IP limit. Someone who knows an admin's email can keep it locked; `npm run cms:admin -- unlock` clears it.
- **Setup links:** 32 random bytes, after `#` so they never reach server logs or other websites; stored as SHA-256; single use; 72 hours (invitation) or 24 hours (reset); a new link cancels the previous one.
- **CSRF:** every change must come from this website (Origin check), in addition to the SameSite cookie.
- **Authorization:** checked on the server in every admin page and API, per website. `proxy.ts` only redirects early; it is not relied on.
- **Admin pages:** `noindex`, `no-store`, not frameable, without the website's analytics, chat, navigation and footer.
- **Uploads:** signed-in users only; type checked from file contents, 5 MB limit, stored on Cloudinary.

Not done: two-factor sign-in, email password reset, and a server-wide rate limit for the other admin APIs (they require a signed-in user).

## Switching the public blog to the CMS

1. In Atlas, the 20 imported articles still point at image files that only existed on the computer they were imported from. Point them at the website's own copies (dry run first; `--undo` reverses it):

   ```
   npm run cms:relink-images
   npm run cms:relink-images -- --apply
   ```

2. Set `BLOG_SOURCE=cms` and rebuild/redeploy. Pages are generated during the build, so the build should also be able to reach Atlas; if it cannot, it builds with the built-in articles and switches to the CMS's articles within 10 minutes.

With these steps done, the public pages were checked to be identical to the current website for all 35 sitemap addresses (titles, descriptions, canonical tags, structured data, images, links, sitemap, robots).

**Rollback:** set `BLOG_SOURCE=static` and redeploy. The built-in articles are untouched.

**While `BLOG_SOURCE` is not `cms`**, publishing in the admin saves the article but does not put it on the website: its address is the 404 page. Every Customs Wise screen of the admin says so in a yellow note. Under `npm run dev`, each 404 of an article address also says why in the terminal: static mode, a draft, scheduled for later, or no such slug.

**If the database cannot be reached** (with `BLOG_SOURCE=cms`), articles already shown keep being served from their last good copy. An address never seen before answers 500 ("try again later"), never the 404 page, because it cannot be checked. The server log says `[blog] The CMS could not be read`.

**If the database is down:** pages already generated keep being served; new or regenerated pages fall back to the built-in articles; unknown addresses still get the 404 page. The admin answers "unavailable" and changes nothing.

## Tests

The website must be running (`CMS_TEST_URL`, default `http://127.0.0.1:3100`) with the same `MONGODB_URI`/`MONGODB_DB` the test uses. Tests create temporary `@example.invalid` accounts and remove them.

| Command | What it checks | Use against |
| --- | --- | --- |
| `npm run cms:test:auth` | Sign-in, sessions, CSRF, brute-force locks, roles, password change, the hidden demo website | A test database |
| `npm run cms:test:env-admin` | Administrator from the settings: sign-in, sessions, sign-out, limits and wrong settings with the database unreachable (needs no database; run after `npm run build`) | Nothing else |
| `npm run cms:test:users` | Users screen, invitations, setup and reset links, disable/enable, sign-out, roles (51 checks) | A test database |
| `npm run cms:test:workflow` | Articles, uploads, validation, publishing, website pages, the hidden demo website | A test database, with `CMS_IMAGES=local` |
| `npm run cms:test:live` (`--verify`, `--cleanup`) | Real Cloudinary uploads and MongoDB records through the admin (45 checks) | The real services; cleans up after itself |

## Hosting notes (Hostinger)

### Settings on the live website

Set these in hPanel → the Node.js app → **Environment variables**, never in a file in the repository, then restart the app:

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | The Atlas connection string, with a database user that has `readWrite` on `blog_cms` only. URL-encode special characters in its password. |
| `MONGODB_DB` | `blog_cms` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` | From `npm run cms:admin-env -- --email you@example.com --print`, run on your computer. Paste the hash exactly as printed (`scrypt:...`). |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | From Cloudinary → Settings → API Keys |
| `BLOG_SOURCE` | Leave unset (built-in articles) until the switch described above; then `cms` |

Never set `CMS_DEV_ACCESS`, `CMS_STORE` or `CMS_IMAGES` there: they are for local development only.

### Atlas network access for the live website

Atlas only accepts connections from addresses in **Network Access**. The live website connects from **Hostinger's server**, not from your computer, so:

- Add the Hostinger server's **outgoing** IP address. hPanel shows the server's IP under the hosting plan's details; Hostinger support can confirm the outgoing address if it differs. After adding it, `/admin-blog/api/health` should answer 200.
- Your own computer's address is not needed for the live website. Home and mobile connections change address often, which is why local sign-in keeps failing with `(network-access)` in the log. For local work, add your current address as a **temporary** Atlas entry, or use the local test database (`npm run dev:admin`).
- If the hosting plan has no fixed outgoing address (some shared plans), the safe options are a plan with a fixed IP (VPS or Cloud hosting), or support's list of outgoing addresses. Allowing every address (`0.0.0.0/0`) works but leaves only the database password protecting the data. If it is ever used, use a long random database password and `readWrite` on `blog_cms` only.

### What still works without the database

- **The administrator from the settings can always sign in** (`ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH`). Sign-in, the session and sign-out use no database at all (`npm run cms:test:env-admin` proves it with the database unreachable).
- **Everything else needs the database:** articles, categories, authors, images, Users, the activity log, and sign-in for every other account. While it is unreachable, those screens show "This screen could not be loaded" and the other accounts get "Sign-in is not available… cannot be reached".
- **The public website keeps working:** pages already generated are served, and the blog falls back to the built-in articles.

### Diagnosis

- `/admin-blog/api/health` answers 200 only after querying the database. On 503, `reason` says which side is wrong: `not-configured` (`MONGODB_URI` or `MONGODB_DB` missing or invalid, or the app was not restarted after adding them) or `unreachable` (settings present, but Atlas refused or could not be reached).
- The server log names the cause: `[store] MongoDB connection failed (network-access | authentication | dns | network | permission | timeout): <what to do>`. It never contains the connection string, user name or password.
- `[auth] No administrator is set in the server settings...` means `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH` are not set where the server reads them, so sign-in fell back to the database.
- Locally, `npm run cms:admin -- check` shows the database it would use and why it cannot connect.

### Other notes

- Same app and build as before: `npm run build` (`next build --webpack`), `npm run start`. No new native modules.
- Atlas must also allow the server when the site is **built** with `BLOG_SOURCE=cms`.
- Sessions of the administrator from the settings are kept in the server's memory: a restart signs it out. If the app ever runs as several processes at once, a session is only known to the process that created it.
- Each password check uses about 128 MB of memory briefly (at most two at a time).
- Admin responses send `Cache-Control: no-store`. If LiteSpeed's page cache is enabled for the site, check that it does not cache `/admin-blog` and that it respects revalidation of blog pages; otherwise new articles may appear late.
