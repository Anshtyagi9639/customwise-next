# Customs Wise Blog CMS: Hostinger Deployment Plan

Status: **plan only**. No hosting, DNS or deployment setting has been changed. Each fact below is marked **Verified** (checked directly on 13 October 2026), **Published** (stated in Hostinger's documentation, not tested on this account) or **To check** (unknown until someone looks in the account).

Companion documents: [Requirements](BLOG_CMS_REQUIREMENTS.md) · [Architecture](BLOG_CMS_ARCHITECTURE.md) · [Implementation plan](BLOG_CMS_IMPLEMENTATION_PLAN.md)

## 1. Current setup

| Fact | Status |
| --- | --- |
| `www.customswise.ie` is served by Hostinger as a Next.js Node.js application | Verified (response headers) |
| `www.customswise.ie` is an alias of `customswise.ie`, which points to `145.14.152.158` | Verified (DNS lookup) |
| The domain's DNS is hosted at **Blacknight** (`ns1`–`ns4.blacknight.com`), not at Hostinger | Verified (DNS lookup) |
| `cms.customswise.ie`, `blog-admin.customswise.ie` and `manage.customswise.ie` do not exist | Verified (DNS lookup returned "non-existent domain") |
| The website is built on Hostinger from the GitHub repository with `npm run build` (`next build --webpack`) and started with `next start` | Verified in `package.json`; the Hostinger side is inferred from earlier build logs |
| Which Hostinger plan the account is on, and how many Node.js apps it already runs | To check |

Because DNS is at Blacknight, any new subdomain is created in Blacknight's control panel, using the target value Hostinger provides. Hostinger cannot create it by itself.

## 2. Admin address

| Candidate | Assessment |
| --- | --- |
| **`cms.customswise.ie`** (recommended) | Short, conventional, clearly separate from the public site. Own certificate and cookie scope |
| `blog-admin.customswise.ie` | Clear, but advertises "admin" to anyone scanning subdomains, and is tied to "blog" if the CMS later manages other content |
| `manage.customswise.ie` | Vague; could be mistaken for hosting or account management |
| Hostinger temporary URL | Good for the first test deployment only. Not suitable long term: not under the company's domain, may change, and harder to recognise as genuine |

The name is a small factor in security. What protects the CMS is sign-in, rate limiting and keeping it out of search engines. A subdomain keeps the CMS's session cookie from ever being sent to the public website, and lets the CMS be moved or taken offline without touching the public site.

The address is **proposed, not configured**. It is confirmed only that the name is currently unused.

### What creating it involves

1. In Hostinger, add `cms.customswise.ie` as a website / Node.js app and note the DNS target it asks for (an IP address for an A record, or a hostname for a CNAME). **To check:** the exact value and whether the plan allows a subdomain as a separate Node.js app.
2. In Blacknight, add that record for `cms`. Existing records for `@` and `www` are not touched, so the public website is unaffected.
3. Wait for the record to resolve, then issue the free SSL certificate in Hostinger. **Published:** Hostinger provides free SSL; **To check:** that it issues automatically for a domain whose DNS is external.
4. Force HTTPS for the subdomain.

If an image subdomain is wanted later (for example `media.customswise.ie` in front of the image host), it is one more record at Blacknight.

## 3. Hosting requirements

### CMS application

| Requirement | Status |
| --- | --- |
| A Node.js web app slot. Business allows up to 5 Node.js apps, Cloud plans 10 | Published. **To check:** the plan and how many slots are used |
| Node.js 22 (or 20.9 or later, which Next.js 16 requires) | The website already builds on Node 22 here; **To check** for the new app |
| Build from GitHub with environment variables available during the build and at run time | Published |
| Build with webpack, not Turbopack | Verified for this host: Turbopack's native component failed here. Use `next build --webpack` |
| No native add-ons in the CMS's dependencies | Design constraint that follows from the line above. Password hashing uses Node's built-in scrypt; image resizing is done by the image host |
| Outbound HTTPS to MongoDB Atlas (port 27017 over TLS) and to the image host | **To check.** Shared hosting sometimes restricts outbound ports. This is the single most important check |
| A long-running process (the Next.js server) | The website already runs this way |
| Upload request size | Images go from the browser straight to the image host, so the CMS itself only receives small JSON requests |
| Scheduled tasks | Not needed (see Architecture, "Scheduling without a background job") |

### Website (existing app)

No new hosting requirement. It needs two new server-side environment variables and one redeploy when the integration goes live.

### Run together or separately?

The CMS (admin screens and API) is one Node.js app. It should be a **separate** Hostinger app from the public website, on its own subdomain, so that either can be deployed, rolled back or restarted without affecting the other. That is two apps in total: the existing website and the CMS.

If the plan has no free Node.js slot or blocks outbound database connections, the fallback is to host the CMS on a small Node.js platform elsewhere and keep the public website on Hostinger. The architecture does not change; only where the CMS runs.

## 4. Environment variables

Names only. Real values are entered in Hostinger and never committed.

### CMS

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Atlas connection string for the CMS database user |
| `MONGODB_DB` | Database name |
| `SESSION_SECRET` | Signs session cookies |
| `CMS_BASE_URL` | `https://cms.customswise.ie` |
| `PUBLIC_SITE_URL` | `https://www.customswise.ie`, for previews and canonical links |
| `SITE_REVALIDATE_URL` | The website's refresh endpoint |
| `SITE_REVALIDATE_SECRET` | Shared secret for that endpoint |
| `IMAGE_CLOUD_NAME`, `IMAGE_API_KEY`, `IMAGE_API_SECRET` | Image host account (names depend on the provider chosen) |

None of these is a `NEXT_PUBLIC_` variable. The admin screens get what they need from the server.

### Website (additions)

| Variable | Purpose |
| --- | --- |
| `BLOG_API_URL` | `https://cms.customswise.ie/api/public` |
| `BLOG_REVALIDATE_SECRET` | Must match the CMS's `SITE_REVALIDATE_SECRET` |

Both are read on the server only. Hostinger's documentation says environment variables are available to both the build and the running app and persist across deployments (Published). Earlier in this project the `NEXT_PUBLIC_UWEBCHAT_*` values were missing from a live build, so confirm after the first deployment that the values are actually present.

## 5. MongoDB Atlas

- Create a dedicated Atlas project, cluster and database user for the CMS. A free or smallest shared tier is enough for this volume; **To check** current tier limits and whether backups are included on the tier chosen.
- Choose a region close to the Hostinger server (Europe).
- **Network access.** Atlas only accepts connections from allow-listed IP addresses. **To check:** whether the Hostinger app's outbound IP is fixed. If it is, allow only that address. If it is not, the allow-list must be opened to all addresses, and security then rests on a long random database password, TLS, and a database user limited to this one database. That is common on shared hosting but should be a conscious decision.
- Turn on Atlas backups, or schedule a regular export, before the first real post is written.

## 6. Build and start

| | CMS | Website (unchanged) |
| --- | --- | --- |
| Install | `npm ci` | `npm ci` |
| Build | `npm run build` (`next build --webpack`) | `npm run build` |
| Start | `npm run start` (`next start`) | `npm run start` |
| Node | 22 | 22 |
| Health check | `GET /api/health` | Homepage returns 200 |

## 7. Logging, backups, rollback

| Topic | Plan |
| --- | --- |
| Logs | Structured one-line JSON to standard output, with no secrets or article text. **To check:** where Hostinger shows Node.js app logs and how long it keeps them |
| Audit | Publishing and sign-in events are stored in the database (`audit_log`), independent of hosting logs |
| Database backup | Atlas backups or a scheduled export; test one restore before launch |
| Image backup | The image host keeps originals; export the `media` list with the database |
| Deployment | Push to the CMS repository's main branch; Hostinger builds and restarts |
| Rollback | Redeploy the previous commit. Database changes are additive in the first release, so an older build still runs against newer data |
| Website safety net | For the first weeks, keep the current code-based posts available behind a switch so the website can fall back to them with one environment-variable change |
| Monitoring | An external uptime check on `/api/health` and on one article URL |

## 8. Checks to complete before implementation

Answer these in the Hostinger and Blacknight accounts. Items 1 to 3 decide whether the CMS can live on Hostinger at all.

1. Which Hostinger plan is the account on, and how many Node.js app slots are free?
2. Can a Node.js app on this plan open an outbound connection to MongoDB Atlas? (Ask Hostinger support, or test with a tiny script on a temporary app.)
3. Can a subdomain be attached to a second Node.js app while DNS stays at Blacknight, and does SSL issue automatically?
4. Is the app's outbound IP address fixed?
5. Are environment variables injected at build time as documented?
6. Do files written to the app's disk survive a redeploy? (Only matters if images were to be stored on Hostinger.)
7. Where are application logs, and for how long?
8. Who has access to the Blacknight DNS panel?
9. Is there any request-size or time limit on the app that would affect saving long articles?

Do not treat Hostinger as confirmed for the CMS until items 1 to 3 are answered.
