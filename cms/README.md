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

## Settings

Server-side environment variables (never `NEXT_PUBLIC_`). Locally in `.env.local`, in production in the hosting panel. Never commit them.

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | Atlas connection string. Use a database user with `readWrite` on `MONGODB_DB` only. |
| `MONGODB_DB` | `blog_cms` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | From Cloudinary, Settings > API Keys |
| `BLOG_SOURCE` | `static` (default): the public blog shows the built-in articles in `lib/content/blog-posts.ts`. `cms`: it shows the articles published in the admin. |

`CMS_PUBLIC_URL` is not needed: image addresses use `NEXT_PUBLIC_SITE_URL`. `CMS_STORE=json` and `CMS_IMAGES=local` exist for local tests only.

The admin always needs MongoDB. If the database is not configured or cannot be reached, the admin says so; it never falls back to a local file.

## First administrator

There is no sign-up page and no API that creates accounts. With `MONGODB_URI` and `MONGODB_DB` in `.env.local`, on a computer that Atlas allows to connect:

```
npm run cms:admin -- create --email you@example.com --name "Your Name"
```

The password is asked for twice and not shown (at least 12 characters). Then sign in at `/admin-blog`.

Other commands: `list`, `set-password`, `disable`, `enable`, `unlock`, `sign-out`, and `create --role editor --sites customs-wise` for an editor limited to listed websites. See the top of `scripts/cms/admin-users.mjs`.

## Forgotten password (recovery)

There is no email reset. Someone with database access runs:

```
npm run cms:admin -- set-password --email you@example.com
```

This sets a new password, ends every session of that account and clears any sign-in lock. The user can then change it under **Account**. If the only administrator has lost access, the same command restores it.

## Security

- **Passwords:** scrypt (Node.js built-in crypto, OWASP parameters), never stored or returned in plain text. Unknown accounts take as long to reject as wrong passwords, and get the same message.
- **Sessions:** random token in an HttpOnly, Secure, SameSite=Strict cookie limited to `/admin-blog`; only its hash is stored. Sessions end after 2 hours idle or 12 hours, on sign-out, on password change and when an account is disabled.
- **Brute force:** 5 failures per email or 20 per IP within 15 minutes lock that email or IP for 15 minutes (stored in MongoDB). Someone who knows an admin's email can keep it locked; `npm run cms:admin -- unlock` clears it.
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

**If the database is down:** pages already generated keep being served; new or regenerated pages fall back to the built-in articles; unknown addresses still get the 404 page. The admin answers "unavailable" and changes nothing.

## Tests

The website must be running (`CMS_TEST_URL`, default `http://127.0.0.1:3100`) with the same `MONGODB_URI`/`MONGODB_DB` the test uses. Tests create temporary `@example.invalid` accounts and remove them.

| Command | What it checks | Use against |
| --- | --- | --- |
| `npm run cms:test:auth` | Sign-in, sessions, CSRF, brute-force locks, roles, password change (63 checks) | A test database |
| `npm run cms:test:workflow` | Articles, uploads, validation, publishing, website pages, isolation (62 checks) | A test database, with `CMS_IMAGES=local` |
| `npm run cms:test:live` (`--verify`, `--cleanup`) | Real Cloudinary uploads and MongoDB records through the admin (45 checks) | The real services; cleans up after itself |

## Hosting notes (Hostinger)

- Same app and build as before: `npm run build` (`next build --webpack`), `npm run start`. No new native modules.
- Atlas must allow the server's outbound IP address (Network Access), for the build too if `BLOG_SOURCE=cms`.
- Each password check uses about 128 MB of memory briefly (at most two at a time).
- Admin responses send `Cache-Control: no-store`. If LiteSpeed's page cache is enabled for the site, check that it does not cache `/admin-blog` and that it respects revalidation of blog pages; otherwise new articles may appear late.
