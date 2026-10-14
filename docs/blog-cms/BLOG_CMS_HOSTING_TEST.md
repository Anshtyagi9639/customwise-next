# Blog CMS: Hostinger Hosting Test

Status: **prepared, not run**. Nothing in this document has been done. The test runs only after the owner confirms account access and approves it.

Related: [Multi-site plan](BLOG_CMS_MULTI_SITE_PLAN.md) · [Hostinger deployment](BLOG_CMS_HOSTINGER_DEPLOYMENT.md)

## 1. Purpose

Find out, with evidence, whether the Hostinger account that runs `www.customswise.ie` can also run the Blog CMS. The result decides where the CMS is hosted. It is a compatibility test, not the start of the build: the test app is thrown away afterwards.

## 2. What is already known without account access

| Fact | Source |
| --- | --- |
| `www.customswise.ie` is served by Hostinger (LiteSpeed in front of a Next.js Node.js app) | Live response headers, checked 13 October 2026 |
| The site is built with `next build --webpack` and started with `next start` | `package.json` in the website repository |
| Turbopack builds fail on this host: its native component could not load | Earlier build log for this project |
| A previous live build was missing `NEXT_PUBLIC_` values that were set only in a local `.env` | Inspection of the live JavaScript during the uWebChat work |
| DNS for `customswise.ie` is at Blacknight, not Hostinger | DNS lookup |
| Hostinger documents Node.js apps on Business (up to 5) and Cloud (up to 10) plans, with environment variables available to build and run | Hostinger documentation; not tested on this account |

Everything else needs the account.

## 3. Safety rules for the test

- A **new, separate** Node.js app on a Hostinger temporary address. The existing website app is not opened, edited, restarted or redeployed.
- **No DNS changes.** No record is added or edited at Blacknight or Hostinger. Custom-domain support is checked by reading what the panel offers, stopping before anything is saved.
- No files are placed in, or removed from, the existing website's folders.
- Test accounts only: a free Atlas cluster with made-up data, a free image-host account. No paid resource is created.
- Test credentials are entered only in Hostinger's environment-variable screen. They are not committed, not put in chat, and are deleted at the end.
- The test app exposes no sensitive output: its report shows pass or fail and non-secret facts (versions, timings), never credential values.
- Everything created is listed in section 8 and removed in section 9.

## 4. Access and approvals needed

| Needed | Who | Why |
| --- | --- | --- |
| Approval of this document | Owner | Nothing runs before it |
| Hostinger panel access | Owner signs in and performs the panel steps (sections 6.1, 6.4, 6.9), or grants access for them to be performed | Creating the test app, entering variables, reading plan details |
| A free MongoDB Atlas cluster for the test, and its connection string | Owner, or whoever will manage Atlas. Decide first whether this is the existing account or a new one | Check 3. A free tier is sufficient; confirm nothing billable is selected |
| A free Cloudinary account's cloud name | Owner | Check 7 |
| Permission to create a small private GitHub repository `cms-hosting-test` | Owner | Hostinger deploys from GitHub |
| Confirmation of the Hostinger plan name | Owner (shown in the panel) | Check 1 |

If any of these cannot be provided, the related check is recorded as "not tested", not as passed.

## 5. The test app

A minimal Next.js app (same major version as the planned CMS, built with webpack) with no user interface beyond one report page. It contains only:

| Address | What it does |
| --- | --- |
| `/` | Report page: one row per check, pass or fail, with the time of the last run |
| `/api/check/runtime` | Node.js version, platform, memory limit visible to the process, uptime |
| `/api/check/env` | Whether each expected variable was present at **build** time and at **run** time. Presence only, never values |
| `/api/check/mongo` | Connects to Atlas, writes one test document, reads it back, deletes it; reports timings and the TLS version |
| `/api/check/outbound-ip` | Asks an external service which address the request came from |
| `/api/check/image-host` | Makes one HTTPS request to the image host's public endpoint and reports reachability and latency. No upload |
| `/api/check/storage` | Writes a small file with a timestamp, and reports the timestamp of any file left by a previous run |
| `/api/check/webhook` | Accepts a signed `POST`, verifies the signature, records the time; rejects unsigned requests |
| `/api/check/stream` | Returns a slow streamed response, to see whether the proxy buffers it |

All check addresses require a test access code supplied as an environment variable, so the app is not open to the internet at large.

## 6. Test actions

Each step lists exactly what is done and what counts as a pass.

### 6.1 Node.js support and resources

1. Read the plan name and the Node.js app allowance in the Hostinger panel; note how many apps exist.
2. Create one new Node.js app from the `cms-hosting-test` repository on a temporary address.
3. Open `/api/check/runtime`.

**Pass:** a free app slot exists, the app builds and starts, and the memory available is enough to build a Next.js app (the build completing is the evidence).

### 6.2 Node.js version and Next.js requirements

1. Note the Node.js versions the panel offers; select 22 (or the newest offered that is at least 20.9).
2. Confirm the build command `next build --webpack` and start command `next start` are accepted.
3. Record build duration.

**Pass:** build and start succeed on a supported Node.js version without native-component errors.

### 6.3 Outbound connectivity to MongoDB Atlas

1. In Atlas, allow access from all addresses **for the test cluster only**, or from the address reported in step 6.3.3.
2. Set the test connection string in Hostinger; redeploy; open `/api/check/mongo`.
3. Open `/api/check/outbound-ip` now, after a restart, and after a redeploy; record whether the address changes.

**Pass:** connect, write, read and delete all succeed over TLS in a reasonable time (well under a second after the first connection). Also recorded: whether the outbound address is fixed, which decides how tight the Atlas allow-list can be.

### 6.4 Environment variables

1. Add test variables in the panel: one plain, one named with the `NEXT_PUBLIC_` prefix.
2. Deploy; open `/api/check/env`.
3. Change one value; restart without rebuilding; check again. Then redeploy; check again.

**Pass:** server variables are present at run time and change on restart; build-time values are present in the build and change on redeploy. The result documents exactly when a rebuild is required.

### 6.5 HTTPS and custom domains

1. Confirm the temporary address is served over HTTPS with a valid certificate.
2. In the panel, start the "add domain or subdomain to this app" flow and read what it requires (record type and target, and whether external DNS is supported). **Stop before saving.**
3. Record whether SSL for an externally hosted DNS domain is automatic.

**Pass:** HTTPS works on the temporary address, and the panel shows a supported path for a custom subdomain with external DNS. The custom domain itself is **not** configured in this test, so it is recorded as "path identified", not "proven".

### 6.6 Persistent storage

1. Open `/api/check/storage` (writes a file).
2. Restart the app; open it again. Redeploy; open it again.

**Pass or fail are both acceptable.** The CMS is designed not to depend on local files. The result is recorded so nobody later assumes otherwise.

### 6.7 Image-host connectivity

1. Open `/api/check/image-host`.

**Pass:** the image host is reachable over HTTPS from the app with normal latency.

### 6.8 Receiving API requests and triggering refreshes

1. From a computer outside Hostinger, send a `GET` to `/api/check/runtime` and a signed `POST` to `/api/check/webhook`; then an unsigned `POST`.
2. From the test app, send a signed `POST` to its **own** webhook address (stands in for the CMS calling a website; the real website is not contacted).
3. Open `/api/check/stream`.

**Pass:** signed requests are accepted, unsigned ones rejected, custom headers and JSON bodies arrive intact, app-to-app calls on the same account work, and no request-size or method restriction interferes. Buffering of streamed responses is recorded for information.

### 6.9 Deploy, restart and rollback

1. Push a visible change; record how the deploy is triggered and how long it takes.
2. Restart the app from the panel; record downtime as seen from an outside request loop.
3. Redeploy the previous commit; confirm the old version is served.
4. Locate the application logs; record how to view them and how far back they go.

**Pass:** each operation is possible from the panel or Git, with a documented procedure and a short, known interruption.

## 7. Recording results

A results table is added to this document when the test is run:

| # | Check | Result | Evidence | Consequence for the CMS |
| --- | --- | --- | --- | --- |
| 1 | Node.js support and resources | | | |
| 2 | Node.js version, build and start | | | |
| 3 | MongoDB Atlas connectivity; outbound address fixed? | | | |
| 4 | Environment variables at build and run | | | |
| 5 | HTTPS; custom-domain path | | | |
| 6 | Persistent storage | | | |
| 7 | Image-host connectivity | | | |
| 8 | Inbound requests, signed webhooks, app-to-app calls | | | |
| 9 | Deploy, restart, rollback, logs | | | |

### How the result is read

- **Checks 1, 2, 3, 4 and 8 must pass** for Hostinger to host the CMS.
- Check 5 must show a workable path; it is proven for real at launch.
- Checks 6, 7 and 9 shape procedures but do not block.

If a must-pass check fails, the recommendation will be to host **the CMS only** on a small managed Node.js platform, chosen then against current pricing and the confirmed data region. The Customs Wise website stays on Hostinger either way.

## 8. What the test creates

| Item | Where |
| --- | --- |
| One private repository `cms-hosting-test` | GitHub |
| One Node.js app on a temporary address | Hostinger |
| Up to eight test environment variables | That app only |
| One free test cluster with one empty test database | MongoDB Atlas |
| One free account, no uploads | Cloudinary |
| One small text file | The test app's own folder |

## 9. Clean-up

1. Delete the Hostinger test app (frees the slot and removes its file and variables).
2. Delete the Atlas test cluster, or at least its database user and the open network rule.
3. Delete or keep the Cloudinary account, as the owner prefers; it holds no data.
4. Archive or delete the `cms-hosting-test` repository.
5. Confirm the existing website app shows no change in its deployment history.

## 10. Not covered by this test

- Real custom-domain DNS and certificate issuance (done at launch, with the owner's confirmation of the domain).
- Performance under load.
- Image uploads end to end (tested in phase 4 with the confirmed account).
- Any interaction with the live Customs Wise website.
