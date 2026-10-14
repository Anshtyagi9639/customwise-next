# Customs Wise Blog CMS: Architecture

Status: **proposal for approval**. Nothing here has been built, installed or configured.

Companion documents: [Requirements](BLOG_CMS_REQUIREMENTS.md) · [Hostinger deployment](BLOG_CMS_HOSTINGER_DEPLOYMENT.md) · [Implementation plan](BLOG_CMS_IMPLEMENTATION_PLAN.md)

## 1. Recommendation in brief

| Topic | Recommendation |
| --- | --- |
| Project name | `customs-wise-blog-cms` |
| Admin address | `cms.customswise.ie` (proposed; not yet created) |
| CMS application | One Next.js application containing the admin screens and the API, deployed as a single Node.js app |
| Database | MongoDB Atlas, a dedicated project and database used only by the CMS |
| Images | An external image host (Cloudinary recommended), not the Hostinger disk and not MongoDB |
| Editor | Tiptap, saving structured JSON limited to the block types the website can render |
| Website integration | The website's server fetches a read-only public API and caches pages; the CMS tells the website when to refresh |
| Scheduling | A publish time on each post, checked on every read. No background job is needed |
| Public article URLs | Unchanged: `https://www.customswise.ie/insights/blog/<slug>` |

## 2. System overview

```
  Administrator's browser                         Visitor's browser
          │  HTTPS, session cookie                        │  HTTPS
          ▼                                               ▼
┌──────────────────────────────┐   refresh call  ┌──────────────────────────────┐
│ CMS  (cms.customswise.ie)    │ ──────────────▶ │ Website (www.customswise.ie) │
│ Next.js, one Node.js app     │  shared secret  │ existing Next.js app         │
│                              │                 │                              │
│  Admin screens               │ ◀────────────── │  server-side fetch of        │
│  Admin API   (signed-in)     │  read-only API  │  published posts, cached     │
│  Public API  (read-only)     │                 │                              │
└───────┬───────────────┬──────┘                 └──────────────┬───────────────┘
        │               │                                       │
        ▼               ▼                                       ▼
 MongoDB Atlas     Image host  ◀──── images loaded directly by visitors' browsers
 (CMS only)        (public image URLs)
```

Boundaries that must hold:

- Only the CMS server talks to MongoDB. The website and all browsers never do.
- The website holds no admin credentials. It can only read published content.
- Visitors' browsers talk to the website and the image host, never to the CMS.

## 3. Why one application for the CMS, not separate frontend and backend

The brief suggests `frontend/` and `backend/` projects. Both layouts were considered.

| | One Next.js app (recommended) | Separate frontend + backend API |
| --- | --- | --- |
| Hostinger apps used | 1 | 2 (Business allows 5 in total, Cloud 10) |
| Domains and certificates | 1 | 2, or a path proxy |
| CORS for the admin | None (same origin) | Required, with credentialed cookies across origins |
| Deployments to keep in step | 1 | 2 |
| Session cookies | Simple, same site | Cross-site cookie rules to get right |
| Matches existing skills and code | Yes: the website is already Next.js 16 on Hostinger | Adds a second framework (e.g. Express) |
| Independent scaling of API and UI | No | Yes, though not needed at this size |

For one or two editors publishing a few posts a month, the separate layout adds operating cost and security surface with no benefit. The code is still kept in clearly separated layers, so the API could be split out later without a rewrite:

```
customs-wise-blog-cms/
  src/
    app/
      (admin)/            admin screens: sign-in, dashboard, posts, editor, users
      api/admin/...       admin API (every route requires a signed-in session)
      api/public/...      read-only API for the website
    server/               business logic: posts, publishing rules, auth, media, audit
      db/                 MongoDB access and schema validation
    editor/               Tiptap configuration and the allowed block schema
    shared/               types and validation shared by screens and API
  scripts/                one-off import of the 20 existing posts
  docs/                   architecture, setup, deployment, API reference
  tests/
```

*Decision:* if separate `frontend/` and `backend/` deployments are a firm requirement, the same design works with the `api/` and `server/` folders moved into an Express or Fastify service. Budget for the extra rows in the table above.

## 4. How the website gets published posts

Three options were compared.

| Option | How it works | Verdict |
| --- | --- | --- |
| A. Website reads MongoDB directly | Website server connects to Atlas | Rejected. Puts a database credential in the website and couples it to the CMS's internal schema |
| B. Website's server fetches a read-only public API, with cached pages | `GET cms.customswise.ie/api/public/posts…`; pages cached and refreshed on change | **Recommended** |
| C. CMS triggers a full website rebuild on every publish | Keeps today's fully static build | Rejected. Slow (minutes), depends on Hostinger build automation, and scheduled posts would need a job to trigger a build |

### How option B behaves

- The website's blog pages call the public API **from the server**, never from the visitor's browser. No CORS is needed for the public site, and visitors never see the CMS address.
- Pages stay pre-rendered and cached (Next.js incremental static regeneration). A cached page is re-checked in the background at most every 5 minutes.
- When an editor publishes, updates or unpublishes, the CMS calls a small refresh endpoint on the website (protected by a shared secret) so the change appears within seconds instead of minutes.
- Unknown slugs are checked against the API once and return 404. Changed slugs return a 301 redirect.
- **CMS unavailable:** cached pages keep being served. A failed background refresh keeps the previous version. A first-time request for a page that was never cached returns a normal 404 or a brief "try again" page rather than a crash. Before go-live, every existing post is requested once so all 20 are cached.
- **Build time:** the website's build fetches the post list. If the CMS is unreachable during a build, the build must still succeed and fill pages on first request.

This changes the website's blog pages from "fully static, generated only at deploy" to "static, refreshed on demand". Everything else on the website is untouched. The website already runs as a Node.js server on Hostinger, which this requires.

### Scheduling without a background job

A post has a status and a publish time. The public API returns a post only if:

```
status is "published"  OR  (status is "scheduled" AND publishAt <= now)
```

A scheduled post therefore becomes visible by itself when its time passes, picked up at the website's next 5-minute check. No cron job or always-on worker is needed, which avoids depending on a Hostinger feature not yet confirmed for Node.js apps. The admin screens show such a post as Published once its time has passed.

## 5. API outline

All responses are JSON. Errors use a fixed shape with a safe message and no stack traces.

### Public API (read-only, no sign-in)

| Method and path | Returns |
| --- | --- |
| `GET /api/public/posts?category=&page=&limit=` | Card fields for visible posts, newest first, with paging |
| `GET /api/public/posts/{slug}` | One visible post with body, or 404, or a redirect target if the slug changed |
| `GET /api/public/categories` | Categories and their visible-post counts |
| `GET /api/public/sitemap` | Slug and last-modified for every visible, indexable post |
| `GET /api/health` | Up/down and database reachability, no details |

Never returned: drafts, future-dated posts, archived posts, editor notes, user data, internal IDs of users, audit data. Query parameters are validated and capped (`limit` at 50). Responses carry cache headers. Requests are rate-limited per IP.

### Admin API (signed-in session required on every route)

| Area | Operations |
| --- | --- |
| Session | Sign in, sign out, current user |
| Posts | List with filters, create, read, update (autosave), publish, schedule, unpublish, archive, delete draft, preview |
| Media | Request an upload, record uploaded image, delete unused image |
| Categories | List; create and rename (admin role) |
| Users | List, invite, disable, reset password (admin role) |
| Audit | Read the log (admin role) |

Every write is validated on the server against the shared schema, checked for the caller's role, and recorded in the audit log.

## 6. MongoDB data model

A new Atlas project and database (for example `customswise_cms`), separate from any other application's data. The Customs Wise website has no MongoDB today, so there is nothing to migrate from or share. Collections are created by the application at first run, not during planning.

### `posts`

| Field | Notes |
| --- | --- |
| `_id` | Stable ID |
| `slug` | Lowercase, hyphenated. **Unique index** across all posts, so a draft cannot take a published post's address |
| `title`, `excerpt` | Length-limited |
| `body` | Tiptap JSON, validated against the allowed block schema on every save |
| `coverImage` | `{ mediaId, url, alt, caption, width, height }` copied in so the public API needs no join |
| `categorySlug` | Reference to `categories.slug` |
| `status` | `draft` · `scheduled` · `published` · `archived` |
| `publishAt` | Date and time (UTC) |
| `hideDate`, `featured`, `noIndex` | Booleans |
| `readMinutes`, `readMinutesOverride` | Calculated on save; override optional |
| `seo` | `{ title, description }`, both optional |
| `relatedLinks` | `[{ label, href }]`, internal paths only |
| `createdAt`, `updatedAt`, `createdBy`, `updatedBy` | Audit fields |
| `legacy` | `true` for the 20 imported posts (keeps supplied read times and missing dates) |

Indexes: unique `slug`; `{ status, publishAt: -1 }` for listings; `{ categorySlug, status, publishAt: -1 }` for filtered listings; text index on `title` and `excerpt` for admin search.

Retention: archived posts are kept (their URLs may redirect). Deleted drafts are removed permanently.

### `categories`

Stored separately, referenced by slug. There are four today (Food customs, Regulatory updates, Trade policy, Practical guidance). Separate storage gives one place to rename a label, a stable slug for filters, and a way to stop two near-duplicate categories appearing. Fields: `slug` (unique), `label`, `order`, `active`.

Tags, if added later, should be embedded in the post as an array of strings: they are free-form, numerous and need no metadata. They are not in the first release.

### `media`

| Field | Notes |
| --- | --- |
| `_id`, `provider`, `providerId` | Where the file lives |
| `url` | Public address of the original |
| `width`, `height`, `bytes`, `format` | From the image host's response |
| `alt` | Default alt text; a post can override it |
| `uploadedBy`, `uploadedAt` | Audit |
| `usedIn` | Post IDs, so unused images can be cleaned up safely |

MongoDB stores references and metadata only, never image bytes.

### `users`

`email` (unique, lowercase), `name`, `passwordHash`, `role` (`admin` or `editor`), `active`, `createdAt`, `lastLoginAt`, later `totpSecret`. Password hashes are never returned by any API.

### `sessions`

`_id` (random token, stored hashed), `userId`, `createdAt`, `expiresAt`, `userAgent`. A TTL index on `expiresAt` removes expired sessions automatically. Signing out or disabling a user deletes their sessions.

### `redirects`

`fromSlug` (unique), `toSlug`, `createdAt`. Written when a published post's slug changes. Chains are flattened so one hop always reaches the current address.

### `audit_log`

`at`, `userId`, `action` (`post.publish`, `post.unpublish`, `post.slug_change`, `user.create`, `login.failed` and so on), `targetId`, short `summary`. Append-only. Suggested retention 12 months via a TTL index. No article text or passwords are logged.

### `revisions` (not in the first release)

Add only if editors ask to compare or restore earlier versions. Design: one document per save of a published post, capped at the last 20 per post.

### Access

One database user for the CMS application with read/write on this database only. No other application, and no person's everyday account, uses it. The Atlas network allow-list is covered in the deployment document.

## 7. Rich-text editor

| Editor | Fit |
| --- | --- |
| **Tiptap** (recommended) | Built on ProseMirror, React-friendly, saves structured JSON, lets us allow exactly the node types the site renders, well maintained, image and table extensions available |
| Lexical | Capable and maintained; less ready-made tooling for a restricted schema and tables |
| Editor.js | Block JSON output suits the model, but inline formatting and maintenance pace are weaker |
| Markdown textarea | Simplest, but non-technical editors struggle with images, links and tables, and preview differs from the result |
| HTML editors (TinyMCE, CKEditor) | Produce HTML that would need heavy sanitising and would not match the site's block renderer |

The existing website already renders articles from structured blocks, not HTML. Tiptap's JSON maps onto that model directly, so the website renders CMS content with its own components and never injects raw HTML. That is the main defence against script injection through article content. The editor must be loaded client-side only in Next.js, which is a known and documented setup.

## 8. Images

| Option | For | Against |
| --- | --- | --- |
| Hostinger disk | No extra service | Not confirmed that uploaded files survive a redeploy of a Hostinger Node.js app; backups and resizing are ours to build; ties images to one server |
| Image bytes in MongoDB | One system | Bloats the database and its backups, slow to serve, no resizing. Not recommended |
| S3-compatible object storage (e.g. Cloudflare R2) | Cheap, durable, portable | Resizing must run in our app, which needs a native image library. The website's host has already rejected one native component (the Turbopack build failure), so this is a real risk until tested |
| **Dedicated image host (Cloudinary recommended)** | Stores, resizes, converts and serves from a CDN by URL; no native code in our app; direct browser-to-host uploads with a signed request | Another account to own; free-tier limits must be checked against expected volume |

How it works with the recommended option:

1. The editor picks a file. The admin screen checks type (JPEG, PNG, WebP, AVIF) and size (5 MB limit).
2. The CMS server issues a short-lived signed upload permission. The secret stays on the server.
3. The browser uploads straight to the image host, which re-checks type and size.
4. The CMS records the result in `media` and attaches it to the post with alt text.
5. The website requests the image at the sizes it needs through URL parameters (for example 480, 768 and 1200 px wide, in a modern format), so cards and articles load appropriately sized files.

The image host's domain must be added to the website's allowed image sources. The website currently has image optimisation switched off, so responsive sizes come from the image host's URLs rather than from Next.js.

Filenames are generated, never taken from the upload. Originals are kept by the host; a periodic export of the `media` list plus the host's own backup covers recovery.

The 20 existing images stay where they are in the website's `public/images/blog/` folder and are referenced by their current paths, so no existing image URL changes. *Decision:* whether to move them to the image host later.

## 9. Security

### Sign-in and sessions

- Email and password. Passwords hashed with a slow, salted algorithm available without native add-ons (Node's built-in scrypt), minimum length enforced.
- Server-side sessions with a random token in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie. Idle timeout and absolute expiry.
- Sign-in attempts rate-limited per account and per IP, with failures logged.
- No public sign-up. The first admin is created by a one-off command; others are invited by an admin.
- Two roles: **admin** (everything, including users) and **editor** (posts and media).
- Two-step sign-in with an authenticator app recommended shortly after launch.

### Admin API

- Session required on every route, checked on the server, plus a role check.
- State-changing requests require the same-site cookie and a matching `Origin` header.
- All input validated on the server; article bodies checked against the allowed block schema; links restricted to `http`, `https`, `mailto`, `tel` and site-relative paths.
- Important actions written to the audit log.

### Public API

- Read-only by construction: it has no write routes and uses queries that can only match visible posts.
- Returns a fixed list of public fields.
- Paging limits, query validation, rate limiting, safe error messages.

### Cross-origin rules

- Admin screens and admin API share one origin, so the admin API allows **no** cross-origin requests.
- The public API is called by the website's server, where CORS does not apply. It therefore needs no permissive CORS header. If a future feature calls it from visitors' browsers, allow only `https://www.customswise.ie` for `GET`.

### Secrets

- All credentials (database connection string, session secret, image-host secret, refresh secret) are server-side environment variables on the CMS.
- The website receives only two values: the CMS public API address and the shared refresh secret. Neither is a `NEXT_PUBLIC_` variable.
- Nothing secret is committed. The CMS site sends `X-Robots-Tag: noindex` on every response and disallows crawling.

## 10. SEO and indexing

| Requirement | Approach |
| --- | --- |
| Rendering | Article and listing pages remain pre-rendered HTML, served from cache |
| Titles and descriptions | SEO title or `Title \| Customs Wise`; meta description or excerpt. The CMS warns on duplicates and on lengths outside the usual display range |
| Canonical | Always the article's own URL on `www.customswise.ie` |
| Open Graph / Twitter | As today, using the cover image when large enough |
| Structured data | `BlogPosting` with headline, description, `datePublished`, `dateModified`, image, section; organisation as author and publisher unless named authors are approved. `BreadcrumbList` as today |
| Sitemap | Generated from the public API, with `lastModified` from `updatedAt`. New posts appear at the next refresh |
| Robots | Posts flagged "hide from search engines" get a `noindex` tag and are left out of the sitemap |
| Status codes | 200, 404 and 301 as described in the requirements |
| Slug changes | Permanent redirect from every old address |
| Images | Alt text required before publishing a post with a cover image; inline images require alt text or an explicit "decorative" choice |
| Headings | One H1 (the title); the editor offers H2 and H3 only |
| Internal links | Related site pages and related posts on every article, as today |
| Insights and Blog | Remain separate sections. No navigation change |

Discovery of new posts relies on the sitemap (already referenced from `robots.txt`), links from `/blog` and the homepage, and optionally a manual "Request indexing" in Google Search Console for important posts. None of this guarantees indexing or ranking.

## 11. Open architectural decisions

1. One CMS application, or separate frontend and backend deployments (section 3).
2. Image host: Cloudinary, or object storage, or the Hostinger disk if persistence is confirmed (section 8).
3. Named authors: yes, "Customs Wise" only, or none (requirements, section 3).
4. Whether the 20 existing images move to the image host.
5. Who the first administrators are, and whether two-step sign-in is required at launch.
