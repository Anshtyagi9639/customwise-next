# Customs Wise Blog CMS: Implementation Plan

Status: **plan only**. Work starts after the requirements and architecture are approved and the hosting checks are answered.

Companion documents: [Requirements](BLOG_CMS_REQUIREMENTS.md) · [Architecture](BLOG_CMS_ARCHITECTURE.md) · [Hostinger deployment](BLOG_CMS_HOSTINGER_DEPLOYMENT.md)

## 1. Before any code

| # | Needed | Owner |
| --- | --- | --- |
| 1 | Approve the blog fields (Requirements, section 3) | Customs Wise |
| 2 | Decide: one CMS app or separate frontend and backend | Customs Wise |
| 3 | Decide: named authors, "Customs Wise", or none | Customs Wise |
| 4 | Decide: image host | Customs Wise |
| 5 | Answer hosting checks 1 to 3 (Deployment, section 8) | Whoever holds the Hostinger login |
| 6 | Name the first administrators and editors | Customs Wise |
| 7 | Confirm who can edit DNS at Blacknight | Customs Wise |
| 8 | Create a new empty GitHub repository `customs-wise-blog-cms` | Developer |

## 2. Phases

Each phase ends with something that can be shown and tested. The public website is untouched until phase 5.

### Phase 0: Hosting spike (about 1 day)

Deploy a throwaway Node.js app on Hostinger that connects to a test Atlas database and returns "ok". This answers the outbound-connection, environment-variable and subdomain questions with evidence instead of assumptions. If it fails, choose alternative hosting for the CMS before building anything.

### Phase 1: Foundation

- Project skeleton, lint, type-check, test runner, continuous integration.
- Database connection, schema validation, indexes.
- Sign-in, sessions, roles, rate limiting, audit log, first-admin command.
- Health endpoint.

Done when: an admin can sign in and out on the deployed test address, and signed-out requests to admin routes are refused.

### Phase 2: Content model and public API

- Posts, categories and redirects with all publishing rules.
- Admin API for posts.
- Public read-only API, including the visibility rule for scheduled posts.
- Import script for the 20 existing posts, run against a test database.

Done when: the public API returns the 20 imported posts with the same slugs, titles, excerpts, dates and bodies as the website shows today, and returns no draft or future-dated post under any query.

### Phase 3: Admin screens

- Post list with search and filters; dashboard.
- Editor (Tiptap) limited to the approved blocks; autosave.
- SEO panel with search-result preview and length warnings.
- Publish, schedule, unpublish, archive; slug change with redirect.
- User management.

Done when: a non-developer can create and publish a formatted post unaided.

### Phase 4: Images

- Signed direct upload, type and size checks, alt-text requirement.
- Cover and inline images in the editor.
- Responsive image URLs.

Done when: an uploaded cover image appears on a test card and article at appropriate sizes, and an oversized or wrong-type file is refused.

### Phase 5: Website integration

The only phase that changes the existing website. Done on a branch, behind a switch.

- A data layer that reads posts from `BLOG_API_URL`, with the current code file as fallback when the switch is off.
- Listing, article, homepage section, related posts and sitemap read from that layer.
- Renderer support for the new blocks (inline image, quote).
- Cached pages with periodic re-check, the protected refresh endpoint, 404 and 301 handling.
- Preview route for unpublished posts, reachable only with a signed link from the CMS.

Done when: with the switch on, every existing blog URL renders the same content as before, and a post published in the CMS appears without a redeploy. With the CMS stopped, all blog pages still load.

### Phase 6: Launch

- Create `cms.customswise.ie` (DNS at Blacknight, SSL at Hostinger).
- Production database, backups on, restore tested.
- Import the 20 posts into production; compare each page against the live site.
- Turn the switch on for the website; warm the cache; monitor.
- Short written guide and a walkthrough for editors.

### Phase 7: After launch (as needed)

Two-step sign-in, media library, revision history, tags, named authors, tables, table of contents, "load more" on `/blog`.

## 3. Dependencies

| Phase | Depends on |
| --- | --- |
| 0 | Hostinger login, an Atlas account |
| 1 | Phase 0 result, decisions 2 and 6 |
| 2 | Decision 1 and 3 |
| 4 | Decision 4, image-host account |
| 5 | Phases 2 and 4 |
| 6 | Blacknight DNS access, all earlier phases |

Phases 3 and 4 can overlap. Phase 5 can start once phase 2's public API is stable.

## 4. Testing strategy

| Level | What is covered |
| --- | --- |
| Unit | Slug generation and uniqueness, the visibility rule at boundary times, reading-time calculation, body schema validation, redirect flattening |
| API | Every admin route refuses signed-out and wrong-role callers; every public route returns only visible posts and only public fields; paging limits; malformed input |
| Security | Sign-in rate limiting, session expiry, cookie flags, cross-origin write attempts, script and unsafe-link injection through title, excerpt and body, upload of disallowed files |
| Import | Field-by-field comparison of all 20 imported posts against the current code file |
| Integration | Publish → website shows it; edit → website updates; unpublish → 404; slug change → 301; schedule → hidden before, visible after |
| Resilience | CMS stopped: existing blog pages load; website build succeeds; recovery once the CMS returns |
| Browser | Admin screens and public blog pages at 1440×900 and 390×844; keyboard and screen-reader pass on the editor's main flows |
| SEO regression | For each existing post: title, description, canonical, Open Graph, structured data and sitemap entry unchanged; Lighthouse scores no lower |
| Editor acceptance | A member of staff completes the workflows in Requirements section 5 from a written guide |

Tests that need real services (Hostinger, Atlas, the image host) are reported as not verified until they are run against those services.

## 5. Risks

| Risk | Likelihood | Effect | Mitigation |
| --- | --- | --- | --- |
| Hostinger blocks outbound database connections or has no free Node.js slot | Unknown | CMS cannot be hosted there | Phase 0 spike; fallback hosting for the CMS only |
| Environment variables missing from a Hostinger build (seen before in this project) | Medium | Integration silently off | Health endpoint reports configuration presence (never values); check after first deploy |
| A dependency needs a native component the host rejects (seen with Turbopack) | Medium | Build fails | Webpack build; no native add-ons; image processing outsourced |
| Website shows stale or missing posts when the CMS is down | Low | Brief staleness only | Cached pages, fallback switch, uptime monitoring |
| Existing URLs or metadata change during migration | Low | SEO loss | Field-by-field import comparison; SEO regression checks; slugs never auto-changed |
| A draft or scheduled post leaks | Low | Reputational | Visibility enforced in one server function, covered by boundary tests; preview links signed and short-lived |
| Admin account compromised | Low | Defacement | Rate limiting, strong hashing, audit log, session revocation, two-step sign-in soon after launch |
| Atlas allow-list must be open to all addresses | Medium | Larger attack surface | Long random password, least-privilege database user, TLS; revisit if a fixed IP becomes available |
| Free tiers (Atlas, image host) outgrown or changed | Low | Small monthly cost | Check current limits when accounts are created; data is exportable |
| DNS access at Blacknight unavailable | Unknown | Launch delayed | Confirm access during pre-work |
| Scope growth (tags, authors, revisions, tables) | Medium | Delay | First release is the MVP list only |

## 6. Missing information

- The Hostinger plan and its limits for this account.
- Whether the CMS should carry Customs Wise branding or stay plain (no design is specified for the admin screens).
- Expected posting frequency and number of editors (affects whether "in review" and revisions matter).
- Whether article authors should be named.
- Any data-protection requirements for where content and images are stored (region).

## 7. Acceptance criteria for the project

The eleven criteria in Requirements section 7, plus:

- The CMS is reachable only over HTTPS and is not indexable.
- A restore from backup has been performed once successfully.
- An editor guide exists and a member of staff has published a post using it.
- The website can be switched back to its code-based posts in under five minutes.

## 8. Deployment checklist (for launch day)

- [ ] Hosting checks answered and recorded
- [ ] Atlas production project, database user, backups; restore tested
- [ ] Image-host account and upload restrictions
- [ ] CMS environment variables set in Hostinger; health endpoint confirms configuration
- [ ] `cms` DNS record at Blacknight; SSL issued; HTTPS forced
- [ ] First admin created; default or test accounts removed
- [ ] 20 posts imported; page-by-page comparison signed off
- [ ] Website variables `BLOG_API_URL` and `BLOG_REVALIDATE_SECRET` set; website redeployed
- [ ] Switch turned on; all blog URLs return 200; sitemap lists every post
- [ ] Publish, edit, schedule, unpublish and slug-change tests pass in production
- [ ] CMS-down test: blog pages still load
- [ ] Uptime checks active
- [ ] Rollback steps written down and tried once

## 9. Recommended next step

Run **Phase 0** (the one-day hosting spike) and settle decisions 1 to 4 in parallel. Those two things remove every unknown that could change the design. Implementation of Phase 1 should start only after both.
