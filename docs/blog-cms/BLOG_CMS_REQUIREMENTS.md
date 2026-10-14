# Customs Wise Blog CMS: Requirements

Status: **planning only**. Nothing described here has been built. Items marked *decision* need the owner's answer before implementation.

Companion documents: [Architecture](BLOG_CMS_ARCHITECTURE.md) · [Hostinger deployment](BLOG_CMS_HOSTINGER_DEPLOYMENT.md) · [Implementation plan](BLOG_CMS_IMPLEMENTATION_PLAN.md)

## 1. Business requirement

Customs Wise staff need to write, edit, schedule and publish blog posts themselves, without a developer editing code and redeploying the website. Published posts must appear on the existing website's blog automatically, looking exactly as today's posts do.

The CMS is a separate project. The public website keeps running throughout and changes as little as possible.

## 2. How the blog works today (verified in the code)

| Question | Finding |
| --- | --- |
| Where do posts live? | 20 posts are hard-coded in `lib/content/blog-posts.ts`. Adding a post means editing code and redeploying. There is no database, CMS or API. |
| Blog listing | `/blog`: the newest post as a featured card, then a grid with a topic filter and a text search. No pagination (all 20 are listed). |
| Other places posts appear | Homepage "Blog & Insights" section (3 newest) and "Related articles" under each post. The `/insights` page deliberately lists guides only, not blog posts. |
| Card contents | Cover image (or a text panel if none), topic, read time, date where known, title, excerpt, "Read article" link. |
| Article page | Title, topic / read time / date line, cover image with optional caption, body, a sidebar of related Customs Wise pages and an enquiry call-to-action, three related posts, a closing call-to-action. |
| Article URL | `/insights/blog/<slug>`. The slug is written by hand in the data file. Unknown slugs return 404. |
| Body format | Structured blocks, not HTML: paragraph, H2, H3, bulleted list, numbered list, call-out. Inline text supports bold and links only. |
| Images | Files in `public/images/blog/` (20 files, 4.4 MB), each with alt text and its real width and height. Next.js image optimisation is switched off in `next.config.mjs`, so files are served as uploaded. |
| Authors | Not shown. The code comment says the source only had blog-platform usernames. Structured data names the organisation as author. |
| Dates | Optional. 15 posts have a full date; 5 have none because the source gave no year. |
| SEO | Per-post title (`<title> \| Customs Wise`), excerpt as meta description, canonical URL, Open Graph and Twitter tags (the post's image when at least 600 px wide, otherwise the site image), `BlogPosting` and `BreadcrumbList` structured data. Posts are in `sitemap.xml` (20 confirmed on the live site). |
| Rendering | Every post is pre-built at deploy time as a static page. |

### What must stay the same

- Article URLs: `/insights/blog/<slug>`, including the 20 existing slugs.
- The listing at `/blog`, and `/insights` remaining separate from it.
- The visual design: cards, article layout, typography, colours, header, footer.
- The body's structured-block approach (it is what keeps article markup consistent and safe).
- Existing SEO behaviour, tracking tags, enquiry form and chatbot.

### What has to change on the website

- Posts are read from the CMS instead of the code file.
- Pages refresh when content changes, without a redeploy.
- The body renderer gains the block types the editor adds (inline image, quote, table).
- The sitemap is generated from CMS data.
- The site behaves sensibly when the CMS cannot be reached (section 6).

## 3. Blog content fields

Recommended model: the simplest one that reproduces today's blog and supports an editorial workflow. "MVP" is the first release.

### MVP fields

| Field | Required? | Admin input or automatic? | Public display? | Purpose |
| --- | --- | --- | --- | --- |
| ID | Yes | Automatic | No | Stable identity that survives slug changes |
| Title | Yes | Admin | Yes | Headline, `<h1>`, default SEO title |
| Slug | Yes | Automatic from title, editable until first publish | In the URL | Article address. Unique. Changing it after publish creates a redirect |
| Excerpt | Yes | Admin (1 or 2 sentences, about 160 characters) | Yes, on cards | Card text and default meta description |
| Body | Yes | Admin, rich-text editor | Yes | The article. Stored as structured blocks |
| Cover image | Recommended, not required | Admin upload | Yes | Card and article image. Without one the card shows the existing text panel |
| Cover image alt text | Yes when there is a cover image | Admin | To screen readers | Accessibility; also used in social previews |
| Cover image caption | No | Admin | Yes, under the image | Credit or context (already supported) |
| Category (topic) | Yes | Admin picks one | Yes | Filter on `/blog`, related-post matching, `articleSection` |
| Status | Yes | Admin / automatic | No | Draft, Scheduled, Published, Archived |
| Publish date and time | Yes to publish | Admin (defaults to now) | Yes, as the date | Controls when the post goes live; `datePublished` |
| Hide date | No | Admin tick-box | Affects display | Needed for the 5 legacy posts with no known date |
| Created at / Updated at | Yes | Automatic | Updated at feeds `dateModified` only | Audit and structured data |
| Created by / Updated by | Yes | Automatic | No | Accountability |
| Reading time | Yes | Automatic from word count, with manual override | Yes | Already shown on cards. Legacy posts keep their supplied values |
| Related site pages | No | Admin picks from a list of site pages | Yes, in the sidebar | Internal links to services and guides (existing feature) |
| SEO title | No | Admin; falls back to `Title \| Customs Wise` | In `<title>` | Search-result headline when the title is too long or vague |
| Meta description | No | Admin; falls back to excerpt | In search results | Search snippet |
| Social image | No | Automatic: cover image if at least 600 px wide, else the site image | In link previews | Matches current behaviour |
| Indexing | No | Admin tick-box "hide from search engines", default off | `robots` tag, sitemap | Rare cases such as a time-limited notice |
| Featured | No | Admin tick-box | Affects order | Today the newest post is featured. A manual flag lets staff pin one |

### Automatic on the public site (no field needed)

| Item | How |
| --- | --- |
| Canonical URL | Always the post's own URL. Not editable, so it cannot be set wrongly |
| Open Graph / Twitter title and description | From SEO title and meta description |
| `BlogPosting` and breadcrumb structured data | From title, excerpt, dates, category, image |
| Related blog posts | Same category first, then newest (current logic) |
| Sitemap entry | Every published, indexable post |
| Heading structure | The editor offers H2 and H3 only; the title is the single H1 |

### Later enhancements (not in the first release)

| Field | Why it can wait |
| --- | --- |
| Author name and profile | Not shown today. *Decision:* show a named author, show "Customs Wise", or keep showing none. Structured data keeps the organisation as author either way |
| Tags | Not on the site today; four categories already filter 20 posts well |
| "In review" status | Useful only once more than one person writes and another approves |
| Revision history | Start with "last edited by / at" and an audit log; add stored revisions if staff ask to roll back |
| Editor notes | A private notes box is cheap; add when there is more than one editor |
| Focus keyword | An aid only, with no effect on the site; add with an SEO checklist if wanted |
| Table of contents | Generate automatically from H2s for long posts; a display feature, not a field |
| FAQ block with FAQ structured data | Only where a post really is a set of questions and answers |
| Downloadable files | No current use |
| Social share buttons | Design change to the public site; separate decision |
| Per-post custom Open Graph image | The automatic choice covers current needs |

### Editor formatting

| Element | First release | Notes |
| --- | --- | --- |
| Paragraph, H2, H3, bulleted and numbered lists, call-out, bold, links | Yes | Exactly what the site renders today |
| Inline image with alt text and caption | Yes | New block; needs a small addition to the site's renderer |
| Quote | Yes | New block |
| Table | Later | Needs responsive styling on the site |
| Italic | *Decision* | Not used today; trivial to add |
| Free HTML, embeds, custom colours or fonts | No | Would break visual consistency and open security holes |

External links open in a new tab with `rel="noopener"`; internal links stay in the same tab.

## 4. Admin features

| # | Feature | First release? |
| --- | --- | --- |
| 1 | Secure sign-in and sign-out | Yes |
| 2 | Dashboard: counts by status, recent edits, upcoming scheduled posts | Yes (simple) |
| 3 | Create a post | Yes |
| 4 | Title and slug | Yes |
| 5 | Write and format the article | Yes |
| 6 | Upload a cover image | Yes |
| 7 | Image alt text (required before publishing) | Yes |
| 8 | Select a category | Yes (tags later) |
| 9 | Set the author | Later, pending the author decision |
| 10 | Preview the post as it will look on the website | Yes |
| 11 | Edit SEO title and description, with a search-result preview | Yes |
| 12 | Save a draft (with autosave) | Yes |
| 13 | Publish now or schedule | Yes |
| 14 | Edit a published post | Yes |
| 15 | Unpublish or archive | Yes |
| 16 | Search and filter the post list by status, category and text | Yes |
| 17 | Delete | Yes, drafts only. Published posts are archived, not deleted, so URLs can redirect |
| 18 | Manage users (invite, disable, reset password) | Yes, minimal |
| 19 | Media library (reuse uploaded images) | Later; first release uploads per post |
| 20 | Two-step sign-in (authenticator app) | Recommended soon after launch |

## 5. Workflows

**Write and publish.** Sign in → New post → title (slug fills in) → write → upload cover image and alt text → choose category → write excerpt → Preview → Publish. The post is on the website within about a minute.

**Schedule.** As above, but choose a future date and time. Status shows Scheduled. At that time the post appears on the website without anyone being signed in.

**Correct a published post.** Open it → edit → Save. The website updates within about a minute. "Updated at" changes; the published date does not.

**Rename a published post's URL.** Change the slug → the CMS warns that the address will change → on confirm, the old address redirects permanently to the new one.

**Take a post down.** Unpublish (returns to Draft) or Archive. The address then returns "not found" unless a redirect to another post is chosen.

## 6. Public website requirements

- Only posts that are Published, or Scheduled with a publish time in the past, are ever visible or returned by the public API.
- Drafts, future-dated posts, archived posts, editor notes and user data are never exposed.
- `/blog` lists posts newest first with the existing featured card, topic filter and search. Add "load more" once there are more than about 30 posts.
- Article pages keep today's layout and gain inline images and quotes.
- Correct status codes: 200 for published posts, 404 for unknown or unpublished, 301 for changed slugs.
- **If the CMS is unreachable:** the website keeps showing the last successfully loaded version of every blog page. It never shows an error page, an empty blog or placeholder articles because of a CMS outage. New changes simply appear once the CMS is back.
- No invented content: the CMS ships with the 20 existing posts imported as they are, and nothing else.

## 7. Acceptance criteria

1. An administrator can create, preview, publish, edit, schedule, unpublish and archive a post without developer help.
2. A published post appears on `/blog`, the homepage section, related posts and `sitemap.xml` within 2 minutes, with no redeploy.
3. A scheduled post is not reachable by URL or API before its time, and appears within 5 minutes after it.
4. All 20 existing posts are present with identical URLs, text, images, dates and metadata.
5. A post created in the CMS is visually indistinguishable in layout from an existing post.
6. Signed-out requests to any admin page or admin API are refused.
7. The public API returns nothing but published content.
8. With the CMS switched off, every existing blog page on the website still loads.
9. Changing a published slug leaves the old URL redirecting to the new one.
10. Uploaded images are restricted by type and size, and are displayed without the visitor needing to sign in.
11. Lighthouse SEO and accessibility scores for blog pages are no lower than before.
