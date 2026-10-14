# Blog CMS: Multi-Website Plan

Status: **decisions recorded 13 October 2026; implementation not started**. No CMS code exists. The Customs Wise website has not been changed.

> **Pending confirmation (blocks the steps noted):**
> - **Admin domain**: provisional `cms.customswise.ie`; a neutral domain is preferred if one is owned or registered. Blocks launch, not development.
> - **Hostinger plan and Node.js capability**: unverified. Blocks the choice of CMS hosting. See [Hosting test](BLOG_CMS_HOSTING_TEST.md).
> - **MongoDB Atlas account, region and ownership**: unconfirmed. Blocks the hosting test and any provisioning.
> - **Cloudinary account and pricing**: proposed, unconfirmed. Blocks Phase 4.

This document extends the four earlier ones for the new requirement: **one CMS serving several websites**, with Customs Wise as the first. Where it differs from them, this document takes precedence. Section 2 lists what is superseded.

Earlier documents: [Requirements](BLOG_CMS_REQUIREMENTS.md) · [Architecture](BLOG_CMS_ARCHITECTURE.md) · [Hostinger deployment](BLOG_CMS_HOSTINGER_DEPLOYMENT.md) · [Implementation plan](BLOG_CMS_IMPLEMENTATION_PLAN.md) · Next: [Hosting test](BLOG_CMS_HOSTING_TEST.md)

## 1. Confirmed requirements and assumptions

### Confirmed by the owner

- A standalone project in its own repository or folder, not merged into the Customs Wise website.
- One backend and one database for all websites. MongoDB preferred.
- Several websites, each with its own configuration, categories, SEO settings, images and publishing controls.
- A secure admin dashboard: create, edit, preview, publish, unpublish, manage.
- SEO, AEO and GEO support: editable slugs, meta title and description, canonical URL, featured image and alt text, schema markup, author details, publication dates.
- Integration must fit each website's own framework and hosting. Websites are not assumed to share a framework.
- Hostinger compatibility, database hosting, backups, security and deployment to be evaluated.
- **First release serves Customs Wise only.** The design must let further websites be added later without redesign; those sites are specified when they are added.
- Product name **Multi-Site Blog CMS**; repository and folder **`customs-wise-blog-cms`**, created outside the Customs Wise repository.
- One standalone Next.js and TypeScript application containing the admin dashboard and the API.
- An article belongs to one website. Copying to another website creates an independent article. No simultaneous multi-site publishing in the first release.
- The Customs Wise website is not modified during planning or the hosting test. Its integration is a separate phase that needs explicit approval.

### Verified facts (Customs Wise only)

- Next.js 16.3.6 Node.js app on Hostinger; DNS at Blacknight; 20 posts hard-coded; articles at `/insights/blog/<slug>`; body stored as structured blocks. Details in the Requirements document, section 2.
- The bundled Next.js 16.3.6 documentation supports the planned integration: time-based page refresh (`revalidate`), on-demand pages for new slugs, and on-demand refresh by tag. In this version `revalidateTag` requires a second argument (`"max"` is the documented recommendation); calling it with one argument is deprecated.

### Assumptions (not confirmed)

- Future websites will be owned or controlled by the same person or team, and their code can be changed to add an integration. Their platforms are unknown, so only the Next.js integration is built in the first release.
- The live address is `https://www.customswise.ie` (verified by DNS and response headers on 13 October 2026: `www` is an alias of `customswise.ie`). To be re-confirmed at the start of the integration phase, as requested.
- A few editors, a few posts a week at most across all sites.
- Each website's blog pages should live on that website's own domain, not on a shared blog domain.
- Hostinger can host the CMS. This is untested: see section 7.

## 2. Summary of the existing documents, and what changes

| Document | What it established | Still valid? |
| --- | --- | --- |
| Requirements | How the Customs Wise blog works today; the field list; admin features; acceptance criteria | Yes, as the requirements for the **Customs Wise site**. Author details and an editable canonical move from "later" into the first release. A site dimension is added to everything |
| Architecture | One Next.js CMS app; MongoDB Atlas; external image host; Tiptap; website fetches a read-only API and caches pages; publish-time scheduling; security model | Yes, with a `sites` layer added to the data model and API, and one more output format (ready-made HTML) for non-React websites |
| Hostinger deployment | Verified hosting and DNS facts; `cms.customswise.ie` proposed; nine hosting checks | Checks all still open. The admin address and project name are **reopened**, because the CMS is no longer Customs Wise's alone |
| Implementation plan | Seven phases from a hosting spike to launch | Kept, with multi-site work folded into phases 1, 2 and 5 |

Superseded specifics:

- Project name: the product is **Multi-Site Blog CMS**; the repository and folder keep the name `customs-wise-blog-cms`.
- Admin address `cms.customswise.ie` → provisional only. The address is a configuration value (`CMS_BASE_URL`), so it can change without code changes.
- "Canonical URL is automatic and not editable" → automatic by default, with an optional override (needed when one article is reused on another site).
- "Author: later" → author profiles are in the first release.
- Unique slug across all posts → unique **per website**.

## 3. Proposed architecture and technology stack

```
                         ┌───────────────────────────────────────────┐
  Editors ── HTTPS ────▶ │  Blog CMS  (one Next.js app, one Node.js   │
                         │  process)                                  │
                         │   Admin screens      (signed-in)           │
                         │   Admin API          (signed-in, per-site  │
                         │                       permissions)         │
                         │   Public content API (read-only, per site) │
                         └──────┬───────────────────────┬─────────────┘
                                │                       │
                          MongoDB Atlas            Image host
                          (one database,           (one account,
                           every record            one folder
                           tagged with a site)     per site)
                                ▲
        read-only, per-site     │      "content changed" call to each site
   ┌────────────────────────────┴──────────────────────────────────────┐
   │                           │                           │           │
 Customs Wise             Website B                   Website C      …
 Next.js on Hostinger     (framework to be            (framework to be
 server fetch + cache     confirmed)                  confirmed)
```

| Layer | Choice | Why |
| --- | --- | --- |
| CMS application | One Next.js (App Router) + TypeScript app: admin screens and API together | One deployment, one domain, no cross-origin setup for the admin. Same stack as Customs Wise, so one skill set. Code layered so the API can be split out later |
| Database | MongoDB Atlas, dedicated project | Owner's preference; managed backups; reachable from any host |
| Data access | Official MongoDB driver with schema validation (Zod) at the application edge | Fewer moving parts than an ORM for seven small collections |
| Editor | Tiptap, restricted to an approved set of blocks | Structured JSON output; one content format that can be rendered as React components or as HTML |
| Images | External image host (Cloudinary recommended) with a folder per site | Resizing and delivery by URL; no native code on the host; survives redeploys |
| Sign-in | Email and password (Node built-in scrypt), server-side sessions, two roles, per-site access | No native add-ons; simple to audit |
| Content delivery | Versioned read-only JSON API per site, returning **both** structured blocks and ready-made, safe HTML | React sites render blocks with their own components; every other kind of site can insert the HTML |
| Change notification | The CMS calls a per-site webhook when content changes | Each site refreshes in its own way (cache refresh, rebuild, cache file delete) |
| Scheduling | Publish time checked on every read | No background worker needed |

Why not an off-the-shelf headless CMS (Strapi, Payload, Directus, Sanity, WordPress)? They would work and would save building the admin screens. The reasons to build are the owner's stated preference for a bespoke MongoDB system, exact control over the block format the Customs Wise site already uses, and avoiding a heavier server on shared hosting. *This is worth a conscious yes*: if speed matters more than control, Payload (Next.js and MongoDB native) is the closest ready-made fit and should be considered before Phase 1.

## 4. Database structure and multi-website model

One database. Every content record carries a `siteId`. Nothing is shared between sites unless stated.

### The central rule

**An article belongs to exactly one website.** To use an article on a second website, an editor uses "Copy to another site", which creates an independent copy that can be edited for that audience. The copy's canonical URL can point at the original, so search engines do not treat the two as competing duplicates.

This is recommended over "one article, many sites" because each site has its own URL pattern, categories, internal links, brand voice and SEO settings, and because publishing identical text on several domains without a canonical harms all of them. It is also much simpler to reason about permissions and unpublishing. **Confirmed by the owner on 13 October 2026.**

### Collections

| Collection | Scope | Purpose and key fields |
| --- | --- | --- |
| `sites` | Global | One per website. `key` (unique, e.g. `customs-wise`), `name`, `baseUrl`, `articlePathPattern` (e.g. `/insights/blog/{slug}`), `listingPath`, `locale`, `timezone`, `seoDefaults` (title suffix, default social image, organisation name, logo and `sameAs` links for schema), `enabledBlocks`, `webhook` (URL and secret, stored encrypted), `readTokenHash`, `allowedOrigins`, `active` |
| `posts` | Per site | As in the Architecture document, plus `siteId`, `authorId`, `summary`, `faq`, `sources`, `canonicalOverride`, `schemaType`, `copiedFromPostId`. **Unique index on `{ siteId, slug }`** |
| `categories` | Per site | `siteId`, `slug` (unique per site), `label`, `order`, `active` |
| `authors` | Global, linked to sites | `name`, `slug`, `jobTitle`, `bio`, `photo`, `sameAs` links, `siteIds`. An author can write for several sites |
| `media` | Per site | `siteId`, provider reference, dimensions, default alt text, uploader, where used |
| `redirects` | Per site | `siteId`, `fromSlug` (unique per site), `toSlug` |
| `users` | Global | `email`, `name`, `passwordHash`, `active`, `memberships: [{ siteId, role }]`, `isSuperAdmin` |
| `sessions` | Global | Hashed token, user, expiry (auto-removed) |
| `audit_log` | Global, tagged with `siteId` | Who did what, when; 12-month retention |

Indexes on `posts`: `{ siteId, slug }` unique; `{ siteId, status, publishAt: -1 }`; `{ siteId, categorySlug, status, publishAt: -1 }`; text index on title and excerpt.

Every server query for site content takes the site as a required argument, enforced in one data-access layer, so a missing filter cannot leak one site's drafts into another's API. This is covered by tests that run every public route against two sites.

### Permissions

| Role | Can do |
| --- | --- |
| Super admin | Everything: sites, users, all content |
| Site admin (per site) | That site's settings, categories, authors, and all its posts |
| Editor (per site) | Create, edit, publish and unpublish that site's posts and media |

A user sees only the sites they belong to. A separate "writer who cannot publish" role is not in the first release: three roles were confirmed.

### Fields added for SEO, AEO and GEO

These build on the field table in the Requirements document.

| Field | Required? | Shown publicly? | Purpose |
| --- | --- | --- | --- |
| Author | Yes (a site can set a default, e.g. the organisation) | Yes: name, role, short bio | Search engines and AI answer engines weigh who wrote a page. Feeds `author` in schema |
| Summary / key takeaways (2 to 4 short points) | Recommended | Yes, near the top | A direct, quotable answer for answer engines and featured snippets |
| FAQ (question and answer pairs) | Optional | Yes, as a section | Matches question-style searches. Emits `FAQPage` schema only when present |
| Sources (label and URL) | Optional | Yes, at the end | Verifiable claims; useful for regulatory topics |
| Canonical URL | Automatic; optional override | In the page head | Correct attribution when an article is copied between sites |
| Schema type | Automatic (`BlogPosting`); optional `NewsArticle` or `Article` | In structured data | Accurate description of the content |
| Published and last-updated dates | Automatic, editable publish date | Yes | `datePublished`, `dateModified`; freshness signals |
| Last reviewed date | Optional | Yes, if set | Shows a compliance article has been re-checked |
| Meta title, meta description, slug, cover image, alt text, indexing flag | As in the Requirements document | | |

The CMS produces the structured data (article, breadcrumb, FAQ, author, organisation) from these fields and returns it with each post, so every website emits the same correct markup without re-implementing it.

Honest limit: these fields make content clear, attributable and machine-readable. They do not guarantee rankings, featured snippets or citation by AI assistants.

## 5. Project folder structure

A separate folder and Git repository named `customs-wise-blog-cms`, outside the Customs Wise project. *The parent folder on disk and the GitHub account are confirmed when Phase 1 is approved.*

```
customs-wise-blog-cms/
  src/
    app/
      (auth)/                 sign-in
      (admin)/                dashboard, site switcher, posts, editor, media,
                              categories, authors, users, site settings
      api/
        admin/…               signed-in API (session + per-site permission on every route)
        public/v1/sites/[siteKey]/…   read-only content API
        health/
    server/
      auth/                   passwords, sessions, permissions
      sites/                  site configuration, webhooks
      posts/                  publishing rules, visibility, slugs, redirects, copy-to-site
      content/                block schema, block → HTML rendering, structured data
      media/                  signed uploads, image URLs
      audit/
      db/                     connection, collections, indexes, validation
    editor/                   Tiptap setup and the allowed block list
    shared/                   types and validation shared by screens and API
  integrations/
    nextjs/                   small client for Next.js sites (first user: Customs Wise)
    README.md                 the API contract every integration follows
                              (static and PHP clients are added only when such a site joins)
  scripts/
    create-super-admin.ts
    import-customs-wise.ts    one-off import of the 20 existing posts
  tests/
  docs/                       architecture, API reference, deployment, editor guide
  .env.example
```

`integrations/` holds only what is needed for sites that actually exist. Folders for frameworks nobody uses are not built.

## 6. Website integration strategy

### One contract for every website

```
GET /api/public/v1/sites/{siteKey}/posts?category=&page=&limit=
GET /api/public/v1/sites/{siteKey}/posts/{slug}
GET /api/public/v1/sites/{siteKey}/categories
GET /api/public/v1/sites/{siteKey}/authors/{slug}
GET /api/public/v1/sites/{siteKey}/sitemap
```

Each post response includes: the public fields, the body as **blocks** and as **ready-made HTML**, image URLs at several widths, the author, the computed canonical URL, and the structured data as JSON-LD. The HTML is generated by the CMS from the validated blocks, never from free-form input, so it is safe to insert. The API is versioned so a site is not broken by later changes.

Only visible posts are ever returned: published, or scheduled with a publish time in the past.

### Access

- **Server-rendered or build-time sites** send a per-site read token from their server. It limits casual scraping and lets one site's access be revoked. It is not a substitute for the visibility rule: the API returns only public content with or without it.
- **Sites that must fetch from the visitor's browser** cannot keep a token secret. For those, the API allows `GET` from that site's listed origins only, with rate limiting.
- The admin API accepts no cross-origin requests at all.

### Choosing the method per website

| Website type | Method | SEO quality | Update speed |
| --- | --- | --- | --- |
| **Server-rendered** (Next.js, Nuxt, Remix, Astro SSR, Laravel, Express) | Server fetches the API and caches pages; the webhook refreshes the cache | Full | Seconds |
| **Static build** (static export, Astro, Hugo, Eleventy, plain generator) | Fetch at build time; the webhook triggers the host's rebuild | Full | The build time, typically minutes. Scheduled posts need a timed rebuild |
| **PHP on shared hosting, including WordPress themes** | A small PHP client fetches, caches to a file and prints the HTML; the webhook clears the cache | Full | Seconds |
| **Site that cannot run server code or rebuild** | A script fetches in the browser and inserts the content | Weak: content is not in the page source. Last resort only | Immediate |
| **Site that cannot be modified at all** | The CMS renders the blog itself on a subdomain such as `blog.example.com` | Good, but on a subdomain, not the main domain | Immediate. Not in the first release |

The method is recorded in each site's settings. **First release: only the server-rendered row is built, for Customs Wise.** The API already returns ready-made HTML and signed webhooks, so the other rows can be added per site later without changing the CMS's data model or API.

### Customs Wise specifically

Server-rendered row. Its blog pages fetch `…/sites/customs-wise/posts…` on the server, keep being pre-rendered and cached, re-check periodically, and refresh on the webhook. It renders the **blocks** with its existing components, so articles look exactly as they do now. Article URLs stay `/insights/blog/<slug>`. If the CMS is down, cached pages keep being served, and a switch can return the site to its code-based posts. Nothing on the Customs Wise site changes until that integration phase.

### Preview

"Preview" in the CMS opens the post on the real website through a signed, short-lived link, for sites whose integration supports it. For other sites the CMS shows its own neutral preview.

## 7. Hostinger deployment requirements

The nine checks in the Hostinger deployment document are all still open. Multi-site use adds three points.

| Topic | Position |
| --- | --- |
| Can Hostinger run the CMS? | **Unknown.** Needs a free Node.js app slot (Business: 5, Cloud: 10, per Hostinger's documentation) and outbound access to MongoDB Atlas. Neither is confirmed for this account |
| Where the CMS's address lives | **Pending.** Provisional `cms.customswise.ie`; a neutral domain is preferred. The address is one configuration value. A subdomain needs one DNS record at that domain's DNS provider (for `customswise.ie` that is Blacknight). No domain is bought or configured without the owner's confirmation of the domain and DNS access |
| Build | `next build --webpack`. Turbopack's native component failed on this host before. No native add-ons in dependencies |
| Environment variables | Database URI, session secret, encryption key for stored webhook secrets, image-host credentials, base URL. All server-side. Per-site webhook secrets and read tokens are managed in the CMS, not as environment variables. Confirm after first deploy that values are present: variables were missing from a Customs Wise build earlier |
| Atlas network access | If the host's outbound IP is not fixed, Atlas must accept all addresses; security then rests on a strong credential, TLS and a least-privilege database user |
| Each website's own hosting | Each site needs: outbound HTTPS to the CMS; two server-side settings (API address, read token); and an endpoint or deploy hook the CMS can call. Whether its host supports these must be checked per site |
| Availability | One CMS now sits behind several websites. Every integration must cache, so a CMS outage never takes a website's blog down. An external uptime check is required from day one |
| Backups | Atlas backups on before real content is written; one restore tested before launch; image host retains originals |
| Additional services needed | MongoDB Atlas (required), an image host (required), an uptime monitor (recommended). Email sending for password resets can reuse Resend |
| If Hostinger cannot host it | Host only the CMS on a small Node.js platform elsewhere. No design change; the websites stay where they are |

## 8. Phased implementation plan

Phase 0 runs only after the owner approves the [Hosting test](BLOG_CMS_HOSTING_TEST.md) and confirms account access. Phase 1 does not start until Phase 0 has a result. Phase 5 needs its own explicit approval.

| Phase | Work | Done when |
| --- | --- | --- |
| **0. Hosting test** | Throwaway app on Hostinger, as specified in the Hosting test document | All nine checks have a recorded result, and the CMS's hosting is chosen |
| **1. Foundation** | Repository, tooling, CI; database layer with site scoping; sign-in, sessions, roles and per-site permissions; audit log; super-admin command; health endpoint | A super admin can sign in on the deployed test address, create two sites and a site-limited user; that user cannot see the other site |
| **2. Content and API** | Posts, categories, authors, redirects; publishing and visibility rules; copy-to-site; block schema, HTML rendering and structured data; public API v1; Customs Wise import script on a test database | The API returns the 20 imported posts faithfully for `customs-wise`, nothing for a second site, and no draft or future post under any query |
| **3. Admin screens** | Site switcher, post list, editor, SEO panel with previews, authors, categories, users, site settings | A non-developer can publish a formatted post to a chosen site unaided |
| **4. Images** | Signed uploads into per-site folders, checks, alt-text rules, responsive URLs | Uploaded images display at appropriate sizes; bad files are refused |
| **5. First integration: Customs Wise** *(separate explicit approval required)* | The only phase that changes that website, on a branch behind a switch | Every existing blog URL renders identically from the CMS; a new post appears without redeploy; pages survive a CMS outage |
| **6. Launch for Customs Wise** | DNS, SSL, production database and backups, production import, switch on, monitoring, editor guide | Checklist in the Implementation plan complete |
| **7. Each further website** *(after the first release)* | Confirm its domain, platform, hosting and code access; site settings, categories, authors; the integration for its framework; its own SEO regression check | That site's blog is served from the CMS |
| **8. Later** | Two-step sign-in, media library, revisions, tags, tables, CMS-hosted blog option, writer role | As needed |

### Testing requirements

- **Site isolation:** every admin and public route tested with two sites and users limited to one; no route may return or change another site's data.
- **Visibility:** drafts, future-dated and archived posts unreachable by listing, by slug, by sitemap and by preview without a valid signed link; tested at the publish-time boundary.
- **Content safety:** script and unsafe-link injection attempts through every text field and through crafted editor JSON; generated HTML checked against an allow-list.
- **Authentication:** signed-out and wrong-site access refused on every admin route; rate limiting; session expiry and revocation; cookie flags.
- **Import:** field-by-field comparison of the 20 Customs Wise posts.
- **Integration (per site):** publish, edit, unpublish, schedule, slug change, CMS-down behaviour, build with CMS unreachable.
- **SEO regression (per site):** titles, descriptions, canonicals, structured data and sitemap unchanged for existing URLs.
- **Browser:** admin screens and public pages at desktop and mobile widths; keyboard and screen-reader pass on the editor.
- Anything needing real Hostinger, Atlas or image-host accounts is reported as not verified until run against them.

### Security requirements

- No public sign-up; first user created by command; others invited.
- Passwords hashed with a slow salted algorithm; minimum length; sign-in rate-limited and logged.
- Sessions server-side, in `HttpOnly`, `Secure`, `SameSite=Strict` cookies, with idle and absolute expiry.
- Permission checked on the server for every admin request, including the site.
- All input validated on the server; article bodies validated against the block schema; links limited to safe schemes.
- Secrets only in server-side environment variables or encrypted in the database; none in `NEXT_PUBLIC_` variables, logs, API responses or Git.
- Webhooks signed with a per-site secret; sites verify the signature before refreshing.
- The CMS is served over HTTPS only and marked not to be indexed.
- Audit log for sign-ins, publishing actions, user and site changes.
- Database user limited to the CMS database; backups on; a tested restore.

## 9. Decisions

### Settled (13 October 2026)

| # | Decision | Answer |
| --- | --- | --- |
| 1 | Websites in the first release | Customs Wise only. Others later, each specified when added |
| 2 | Name and shape | Product "Multi-Site Blog CMS"; repository and folder `customs-wise-blog-cms`; separate from the website repository; one Next.js and TypeScript app with admin dashboard and API |
| 3 | Article model | One article, one website (`siteId` on every article). Slugs unique per website. Copy-to-site creates an independent article with its own slug, status, SEO and lifecycle; its canonical may point to the original. Canonical automatic by default with optional manual override. No simultaneous multi-site publishing |
| 6 | Bespoke or ready-made | Bespoke |
| 7 | One application or two | One |
| 8 | Roles | Super admin, site admin, editor; per-site permissions |
| 10 | Authors on Customs Wise | Organisation-level until named authors are provided |
| 11 | Two-step sign-in | Post-launch milestone |
| 12 | Admin screens | Simple and accessible |
| 13 | Existing 20 Customs Wise images | Stay where they are |
| | Standing rules | Existing website's URLs, design and functionality maintained; site-isolation tests, audit logs and cached public content required |

### Pending the owner's confirmation

| Item | What is needed | Blocks |
| --- | --- | --- |
| **Admin domain** | Final choice: a neutral domain (owned or to be registered) or `cms.customswise.ie`; and who has DNS access. Nothing is purchased or configured before this | Launch (phase 6). Development can proceed against a temporary address |
| **Hostinger plan and capability** | Plan name, free Node.js app slots, and approval and account access for the hosting test | Phase 0, and therefore phase 1 |
| **MongoDB Atlas** | Existing account or new; preferred data region; who manages the account, billing and recovery credentials. No paid resources created without approval | The database part of the hosting test; all provisioning |
| **Cloudinary** | Account owner and confirmation that the pricing tier suits expected volume | Phase 4; the image-host part of the hosting test |
| **Location of the new repository** | Parent folder on this computer and the GitHub account or organisation for `customs-wise-blog-cms` | Phase 1 |
| **First users** | Names and email addresses of the first super admin and editors | End of phase 1 |

### Still open, non-blocking

- Whether italic text is allowed in articles (default: yes).
- Whether a named-author profile should later be shown on Customs Wise.
- Retention period for the audit log (default: 12 months).

## 10. Next step

1. Owner reviews the [Hosting test](BLOG_CMS_HOSTING_TEST.md), confirms Hostinger and Atlas access, and approves it.
2. The test is run and its nine results recorded.
3. CMS hosting is chosen from those results (Hostinger, or an alternative for the CMS only).
4. Phase 1 begins in the new repository. The Customs Wise website remains untouched until phase 5 is separately approved.
