# Local CMS prototype and hosting readiness

Date: 13 October 2026

This document covers two things:

1. How to run and use the local Blog CMS prototype, and what it does and does not prove.
2. What is known and unknown about hosting the CMS on the Hostinger plan, and what to check before deciding.

The prototype is a separate project. It is not part of the Customs Wise website, does not change it, and is not deployed anywhere. No hosting account was logged in to, no DNS or hosting setting was changed, and the hosting test in `BLOG_CMS_HOSTING_TEST.md` has not been run.

## Part 1: The local prototype

### Where it is

`C:\Users\AnshTyagi\Downloads\customs-wise-website-final (4)\customs-wise-blog-cms-local`

It sits beside the website folder, not inside it. It is not a git repository and nothing has been committed or pushed.

### How to run it

Node.js 20 or newer is needed (this computer has v20.20.0).

```
cd "C:\Users\AnshTyagi\Downloads\customs-wise-website-final (4)\customs-wise-blog-cms-local"
npm install
npm run sample-image
npm run build
npm run start
```

Leave that window open while you use the CMS. Press Ctrl+C to stop it.

| What | Address |
| --- | --- |
| Start page | http://127.0.0.1:3100 |
| CMS dashboard, Customs Wise test configuration | http://127.0.0.1:3100/admin/customs-wise |
| CMS dashboard, Demo Website (fictional) | http://127.0.0.1:3100/admin/demo-website |
| Local blog preview, Customs Wise | http://127.0.0.1:3100/sites/customs-wise/blog |
| Local blog preview, Demo Website | http://127.0.0.1:3100/sites/demo-website/journal |

These addresses work only on this computer.

### How to create, upload, preview and publish

1. Open the dashboard. The **Website** box at the top left chooses which website you are working on.
2. Choose **Create New Post**.
3. Enter the **Blog title**. The **URL slug** is filled in from the title and can be changed.
4. Write the **Short summary**.
5. Under **Main article content**, add blocks (Heading, Paragraph, lists, Quote, Call-out, Image) and fill them in.
6. Under **Featured image**, choose **Upload image**. For a test, use `samples\sample-cover.png` in the project folder. Then fill in **Image alt text**.
7. Choose a **Category** and an **Author**.
8. Choose the **Preview** tab to see the article in the website's style. Previewing publishes nothing.
9. Choose **Save draft**. The article is stored but is not public.
10. Choose **Publish**. The article appears on the local blog preview. **View on website preview** opens it at its article address.
11. To change it later, edit and choose **Update**. **Unpublish** takes it down; **Publish** puts it back.

Setting **Publish at** to a future time schedules the article. The dashboard lists drafts, scheduled and published articles separately.

### Where content and images are stored

| What | Where (inside the project folder) |
| --- | --- |
| Articles, categories, authors, website settings, activity log | `data\db.json` |
| Uploaded images | `data\uploads\customs-wise\` and `data\uploads\demo-website\` |

Both survive browser refreshes and restarts of the app. To start again from an empty CMS, stop the app and delete the `data` folder.

The local CMS currently holds the 20 existing Customs Wise blog posts, copied in from the website's files with their images so the preview is realistic, and 2 fictional Demo Website posts. The copy was one-way: the website's own files were only read.

### What was tested

| Check | Result |
| --- | --- |
| Type-check (`npm run typecheck`) | Passed |
| Lint (`npm run lint`) | Passed |
| Production build (`npm run build`) | Passed |
| Workflow test through the API (`npm run test:workflow`) | 61 of 61 passed |
| Persistence after stopping and restarting the app | Passed (article, published state and image all still there) |
| Real browser run through the dashboard (headless Chrome), desktop and phone size | 55 of 55 passed, no browser console errors |

The workflow test covers: image upload; refusal of text files, disguised files, empty files and files over 5 MB; refusal of missing required fields; draft, publish, edit, unpublish, republish; scheduling; refusal of a duplicate slug on one website; the same slug allowed on the other website; each website seeing only its own articles in the dashboard, the public API and the preview pages; copy-to-website creating an independent draft; escaping of HTML typed into content.

### What works locally, and what needs an external service

| Area | In the prototype | For production |
| --- | --- | --- |
| Writing, editing, drafts, publishing, scheduling, unpublishing | Real, saved to the local store | Same behaviour, saved to the database |
| Validation (required fields, slugs, links, image type and size) | Real, checked on the server | Same |
| Two websites kept separate | Real | Same, plus per-website user permissions |
| Read-only public API per website | Real (`/api/public/v1/sites/{website}/...`) | Same, plus caching |
| SEO metadata, canonical address, structured data, generated HTML | Real | Same |
| Activity log | Real, basic | Fuller audit log with the user's name |
| **Sign-in, roles, permissions** | **Not implemented. Anyone who can open the page can edit.** | Required before any hosting |
| **Database** | **A JSON file on this computer** | MongoDB Atlas (not created; account and region still to be confirmed) |
| **Image hosting, resizing, modern formats** | **A local folder; images are stored as uploaded** | An image host (Cloudinary is proposed; no account created) |
| **Telling the website a new article is published** | **Not implemented** | A signed webhook so the website refreshes its pages |
| **The real website showing CMS articles** | **Not implemented. The preview uses simplified stand-in pages.** | A change to the website so its blog reads from the public API |
| **Backups, monitoring, error reporting** | **Not implemented** | Required before launch |
| **Version history, editorial approval, media library screen** | **Not implemented** | As in the requirements document |

### Local behaviour compared with production

| | Local prototype | Production |
| --- | --- | --- |
| Who can reach it | This computer only | The internet, behind sign-in |
| Data | One file, one user at a time | A database built for several users and backups |
| Images | Folder next to the app | Image host with its own delivery network |
| Article addresses | `127.0.0.1:3100/sites/customs-wise/insights/blog/...` | `www.customswise.ie/insights/blog/...` |
| Canonical addresses in the page | Already the real website addresses, so SEO output can be reviewed | Same |
| Search engines | Told not to index anything | Website pages indexed; CMS never indexed |
| Header and footer | Simplified stand-ins | The real website's |

The storage and image code are each in one file (`src/server/store.ts`, `src/server/media.ts`) so they can be replaced without rewriting the screens or the rules.

## Part 2: Hosting readiness

### What is known

| Fact | Source |
| --- | --- |
| The hosting plan is called "Unlimited Web Hosting" and runs until 30 September 2028 | Reported by you |
| Whether that plan includes a Node.js application slot | **Not confirmed** |
| The live website www.customswise.ie is a Next.js application, and its responses identified Hostinger as the platform when checked earlier in this project | Observed from the public website |
| DNS for customswise.ie is managed at Blacknight, not Hostinger | Observed earlier in this project |

### What is not known

It is **not established** that the "Unlimited Web Hosting" plan can run the CMS. The live website being a Node.js application shows that some Hostinger service is running one Node.js application for this domain. It does not show:

- that the service is the plan named above, or a different one on the same account;
- that a **second** Node.js application can be added;
- that a second application can have its own address, its own settings and its own restart without touching the website.

Hostinger's public descriptions of Node.js hosting name specific plans and a limited number of applications per plan. "Unlimited Web Hosting" was not a plan name found there, so it cannot be matched to those descriptions without looking at the account. Plan names and inclusions also change over time. The hosting panel for this account is the only reliable source.

### What to check in the Hostinger panel

Looking is enough. Nothing needs to be changed to answer these.

| # | Question | Where to look | Evidence that answers it |
| --- | --- | --- | --- |
| 1 | Does this plan allow Node.js applications at all? | Websites list; plan details page | The plan page listing Node.js web apps, or an "Add website" choice that offers a Node.js application |
| 2 | How many, and how many are used? | Same place | A stated limit, and the count in use. The existing website uses one. |
| 3 | Which Node.js versions are offered? | The existing website's Node.js or deployment settings | A version list including 20 or newer |
| 4 | Can the build command and start command be set? | Same settings | Editable fields, or a clear statement of the commands it runs. The CMS needs `npm run build` and `npm run start` (Next.js built with webpack). |
| 5 | Can each application have its own environment variables, kept private? | Environment variables section | A per-application list that is not shared with the website |
| 6 | Can a subdomain be attached to the second application? | Domains or subdomains section | The option to add one. The DNS record itself would be created at Blacknight. |
| 7 | Does any folder survive a redeploy? | Hosting documentation for the plan; File Manager | A written statement. If unclear, assume **no** and store nothing on the server. |
| 8 | Can the application make outbound connections to MongoDB Atlas (port 27017, TLS)? | Not visible in the panel | Only a test can show this: the reversible check prepared in `BLOG_CMS_HOSTING_TEST.md` |
| 9 | Does the hosting have fixed outbound IP addresses? | Plan details; support | A stated address or range. Without one, the database must accept connections from anywhere and rely on its password and TLS. |
| 10 | Memory and process limits per application | Plan details; resource usage page | Stated limits. The CMS build was memory-hungry on the website's deployment before. |
| 11 | Are application logs available? | The application's page | A log viewer or downloadable log |

Screenshots of the plan details page and the existing website's Node.js settings would settle questions 1 to 6.

Questions 7 to 9 cannot be settled by looking. They need the hosting test, which stays unrun until you confirm access and approve it.

### What would count as proof

| Claim | Proof needed |
| --- | --- |
| The plan supports Node.js | The panel showing a Node.js application option for this plan, or the plan details stating it |
| The right Node.js version | The version list in the panel |
| Build and start commands work | A test application building and starting, with its health address answering |
| Environment variables work | The test application reporting that it can see a harmless test variable (name only, never the value) |
| Persistent storage | A file written before a redeploy still being there after it |
| MongoDB connectivity | The test application connecting to a free test database and reporting success |

The prototype has a health address (`/api/health`) that reports only that it is running and can read its store. The same idea is what the hosting test uses.

### If the plan cannot host the CMS

In rough order of least change:

1. **Upgrade or add a Hostinger plan that includes Node.js applications.** Keeps everything with one provider. Has a cost; confirm the same eleven points on the new plan first.
2. **Host the CMS on a platform built for Next.js applications** (for example Vercel, Netlify, Render or Railway), leaving the website on Hostinger. The website only needs to read the CMS's public API, so the two do not have to share a host. Free tiers exist on several of these; limits and commercial-use terms must be read before choosing.
3. **A small virtual server (VPS)**, from Hostinger or elsewhere. Full control, including persistent disk and fixed IP address, but someone must maintain and patch it.
4. **Keep the CMS off the internet for now.** Editors use it on one computer and publishing produces files that are added to the website through the existing deployment. Cheapest, but only one person can edit and every publish needs a deployment.

In every option the database (MongoDB Atlas) and image host stay separate services, so the choice of where the CMS runs does not lock in the content.

### Before going further

Nothing below has been done, and each needs your decision or approval:

1. Check the Hostinger panel against the table above and share what it shows.
2. Confirm the MongoDB Atlas account and region. A free test cluster is enough for the next stage; nothing paid is needed yet.
3. Confirm whether Cloudinary is the image host, and on which account.
4. Approve and run the reversible hosting test, if the panel shows a spare Node.js application slot.
5. Confirm the CMS address (provisionally `cms.customswise.ie`) and DNS access at Blacknight before any DNS record is created.
6. Build sign-in and permissions before the CMS is placed anywhere reachable from the internet.
