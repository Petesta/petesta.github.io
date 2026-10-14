#!/usr/bin/env node
"use strict";

// Builds the site into dist/, which is what gets published.
//
//   posts/<slug>.md  ->  dist/posts/<slug>.html   (served at /posts/<slug>)
//   pages of the list ->  dist/index.html, dist/page/<n>.html   (/, /page/2, ...)
//
// Each page is index.html with its own <title>, description, canonical, link-preview
// and structured-data tags, and its content already in #content, so search engines
// and link previews see it without running JavaScript. main.js then takes over in the
// browser, drawing the same HTML from render.js. Also writes posts.js (the post data
// main.js reads), sitemap.xml and feed.xml, and copies the static files
// and everything in public/.
//
// Run: npm run build      Preview: npm run preview

const fs = require("fs");
const path = require("path");
const { readPosts, POSTS_DIR } = require("./lib/posts");
const {
  SITE_NAME,
  HOME_TITLE,
  titled,
  escapeHtml,
  readTime,
  renderPost,
  PER_PAGE,
  pageCount,
  pagePosts,
  pageHref,
  pageName,
  pageTitle,
  renderList,
} = require("../render");

// The production address. The canonical tags, link previews, sitemap and feed name it,
// since that's what search engines and other sites read.
const SITE_URL = "https://blog.petesta.com";
// The bio under the role on the home page (main.js's BIO), for the copy without JavaScript
const BIO =
  "I develop scalable, resilient, and secure web applications, specializing in backend engineering, cloud architecture, DevOps, and functional programming.";
const HOME_DESCRIPTION = "Pete Cruz, Software Engineer. A Vim-inspired personal site.";
const AUTHOR = { "@type": "Person", name: SITE_NAME, url: SITE_URL + "/" };
// The link-preview image every page shares (design O1, site-icons-variants-13.html)
const OG_IMAGE = {
  url: SITE_URL + "/og-image.png",
  width: 1200,
  height: 630,
  alt: "Pete Cruz, Software Engineer: a Vim-inspired personal site and blog",
};

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");
// Served as they are
const STATIC = ["style.css", "main.js", "render.js", "404.html"];
// Assets (icons, images): everything in public/ is copied to the root of dist/,
// so public/images/foo.png is served at /images/foo.png
const PUBLIC = path.join(ROOT, "public");

// ── Markdown, with code blocks colored at build time ─────────────────────────

async function markdownRenderer(posts) {
  const { Marked } = await import("marked");
  const { createHighlighter, bundledLanguages } = await import("shiki");

  // Load only the languages the posts use
  const marked = new Marked();
  const langs = new Set();
  for (const p of posts)
    marked.walkTokens(marked.lexer(p.markdown), (t) => {
      if (t.type === "code" && t.lang) langs.add(t.lang.split(/\s/)[0]);
    });
  const known = [...langs].filter((l) => l in bundledLanguages);
  const highlighter = await createHighlighter({ themes: ["nord"], langs: known });

  marked.use({
    renderer: {
      code({ text, lang }) {
        const l = (lang || "").split(/\s/)[0];
        if (!known.includes(l)) return "<pre><code>" + escapeHtml(text) + "</code></pre>\n";
        // Shiki marks each line class="line", which the site already uses for buffer
        // lines, so rename it
        return (
          highlighter
            .codeToHtml(text, { lang: l, theme: "nord" })
            .replace(/<span class="line">/g, '<span class="cl">') + "\n"
        );
      },
    },
  });
  return (md) => marked.parse(md);
}

// ── Pages ────────────────────────────────────────────────────────────────────

const attr = (s) => escapeHtml(s);
// JSON inside <script> can't contain "</script>"
const jsonLd = (data) =>
  JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c");

function head({ title, description, url, type, ogTitle, published, readingTime, data }) {
  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${attr(description)}">`,
    `<link rel="canonical" href="${attr(url)}">`,
    `<link rel="alternate" type="application/rss+xml" title="${attr(SITE_NAME)}" href="/feed.xml">`,
    `<meta property="og:type" content="${type}">`,
    `<meta property="og:site_name" content="${attr(SITE_NAME)}">`,
    `<meta property="og:title" content="${attr(ogTitle)}">`,
    `<meta property="og:description" content="${attr(description)}">`,
    `<meta property="og:url" content="${attr(url)}">`,
    `<meta property="og:image" content="${attr(OG_IMAGE.url)}">`,
    `<meta property="og:image:width" content="${OG_IMAGE.width}">`,
    `<meta property="og:image:height" content="${OG_IMAGE.height}">`,
    `<meta property="og:image:alt" content="${attr(OG_IMAGE.alt)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    // Slack shows these as a field under the description; X ignores them
    ...(readingTime
      ? [
          `<meta name="twitter:label1" content="Reading time">`,
          `<meta name="twitter:data1" content="${attr(readingTime)}">`,
        ]
      : []),
    ...(published ? [`<meta property="article:published_time" content="${published}">`] : []),
    `<script type="application/ld+json">${jsonLd(data)}</script>`,
  ].join("\n  ");
}

const once = (html, pattern, replacement, what) => {
  if (!pattern.test(html)) throw new Error(`index.html: couldn't find ${what}`);
  return html.replace(pattern, replacement);
};

// index.html with this page's head tags and content
function page(template, { headHtml, content, reading, file }) {
  let html = once(
    template,
    /<title>[\s\S]*?<\/title>\s*<meta name="description"[^>]*>/,
    headHtml,
    "the <title> and description",
  );
  html = once(
    html,
    /(<article id="content")([^>]*>)<\/article>/,
    (m, open, rest) => `${open}${reading ? ' class="reading"' : ""}${rest}${content}</article>`,
    "the #content article",
  );
  if (file) {
    // The statusline shows the post's file before main.js runs, so it doesn't flash index.html
    html = once(
      html,
      /(<output id="sl-filename"[^>]*>)index\.html(<\/output>)/,
      `$1${file}$2`,
      "the statusline file name",
    );
    html = once(
      html,
      /(<span id="sl-ft-label">)html(<\/span>)/,
      "$1markdown$2",
      "the statusline file type",
    );
  }
  return html;
}

// ── Sitemap, feed ────────────────────────────────────────────────────────────

const xml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
const rfc822 = (iso) => new Date(iso + "T00:00:00Z").toUTCString();
const postUrl = (p) => `${SITE_URL}/posts/${p.slug}`;
const pageUrl = (page) => SITE_URL + pageHref(page);

function sitemap(posts) {
  // Each page of the list was last changed when its newest post was
  const pages = Array.from({ length: pageCount(posts.length) }, (_, i) => i + 1);
  const urls = [
    ...pages.map((page) => ({
      loc: pageUrl(page),
      lastmod: pagePosts(posts, page)[0] && pagePosts(posts, page)[0].date,
    })),
    ...posts.map((p) => ({ loc: postUrl(p), lastmod: p.date })),
  ];
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(
        (u) =>
          `  <url><loc>${xml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`,
      )
      .join("\n") +
    "\n</urlset>\n"
  );
}

function feed(posts) {
  // Dates come from the posts, not the clock, so the same posts always build the same feed
  const items = posts.map((p) =>
    [
      "    <item>",
      `      <title>${xml(p.title)}</title>`,
      `      <link>${xml(postUrl(p))}</link>`,
      `      <guid isPermaLink="true">${xml(postUrl(p))}</guid>`,
      `      <pubDate>${rfc822(p.date)}</pubDate>`,
      `      <description>${xml(p.excerpt)}</description>`,
      ...p.tags.map((t) => `      <category>${xml(t)}</category>`),
      `      <content:encoded><![CDATA[${p.body.replace(/]]>/g, "]]]]><![CDATA[>")}]]></content:encoded>`,
      "    </item>",
    ].join("\n"),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">',
    "  <channel>",
    `    <title>${xml(SITE_NAME)}</title>`,
    `    <link>${xml(SITE_URL + "/")}</link>`,
    `    <description>${xml(HOME_DESCRIPTION)}</description>`,
    "    <language>en</language>",
    `    <atom:link href="${xml(SITE_URL + "/feed.xml")}" rel="self" type="application/rss+xml"/>`,
    ...(posts.length ? [`    <lastBuildDate>${rfc822(posts[0].date)}</lastBuildDate>`] : []),
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

// ── Build ────────────────────────────────────────────────────────────────────

async function build({ postsDir = POSTS_DIR, outDir = DIST } = {}) {
  const posts = readPosts(postsDir);
  const toHtml = await markdownRenderer(posts);
  for (const p of posts) p.body = toHtml(p.markdown);

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, "posts"), { recursive: true });
  fs.mkdirSync(path.join(outDir, "page"), { recursive: true });
  const write = (file, text) => fs.writeFileSync(path.join(outDir, file), text);

  fs.cpSync(PUBLIC, outDir, { recursive: true });
  for (const f of STATIC) fs.copyFileSync(path.join(ROOT, f), path.join(outDir, f));

  const data = posts.map(({ slug, title, date, tags, excerpt, body }) => ({
    slug,
    title,
    date,
    tags,
    excerpt,
    body,
  }));
  write(
    "posts.js",
    [
      "'use strict';",
      "// Generated by scripts/build.js from posts/*.md. Edit the markdown files, not this.",
      "// eslint-disable-next-line no-unused-vars -- read by main.js, which loads after this file",
      `const POSTS = ${JSON.stringify(data, null, 2)};`,
      "",
    ].join("\n"),
  );

  const template = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

  // Home page: a plain copy of the name and the first page of posts for anything that
  // doesn't run JavaScript; main.js replaces it with the full buffer
  write(
    "index.html",
    page(template, {
      headHtml: head({
        title: HOME_TITLE,
        description: HOME_DESCRIPTION,
        url: SITE_URL + "/",
        type: "website",
        ogTitle: HOME_TITLE,
        data: {
          "@type": "WebSite",
          name: SITE_NAME,
          url: SITE_URL + "/",
          description: HOME_DESCRIPTION,
          author: AUTHOR,
        },
      }),
      content: `<div class="prerender"><h1>${escapeHtml(SITE_NAME)}</h1><p>Software Engineer</p><p>${escapeHtml(BIO)}</p>${renderList(posts, 1)}</div>`,
    }),
  );

  // The later pages of the list, /page/2 and on, each with its own posts in the HTML
  for (let n = 2; n <= pageCount(posts.length); n++) {
    const on = pagePosts(posts, n);
    const description = `Posts ${(n - 1) * PER_PAGE + 1}–${(n - 1) * PER_PAGE + on.length} of ${posts.length} by ${SITE_NAME}, newest first.`;
    write(
      `page/${n}.html`,
      page(template, {
        headHtml: head({
          title: pageTitle(n),
          description,
          url: pageUrl(n),
          type: "website",
          ogTitle: pageTitle(n),
          data: {
            "@type": "CollectionPage",
            name: pageTitle(n),
            url: pageUrl(n),
            description,
            isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL + "/" },
          },
        }),
        content: `<div class="prerender"><h1>${escapeHtml(pageName(n))}</h1>${renderList(posts, n)}</div>`,
      }),
    );
  }

  for (const p of posts) {
    write(
      `posts/${p.slug}.html`,
      page(template, {
        headHtml: head({
          title: titled(p.title),
          description: p.excerpt,
          url: postUrl(p),
          type: "article",
          ogTitle: p.title,
          published: p.date,
          readingTime: readTime(p),
          data: {
            "@type": "BlogPosting",
            headline: p.title,
            description: p.excerpt,
            datePublished: p.date,
            dateModified: p.date,
            url: postUrl(p),
            mainEntityOfPage: postUrl(p),
            keywords: p.tags.join(", "),
            author: AUTHOR,
            publisher: AUTHOR,
          },
        }),
        content: renderPost(p, posts),
        reading: true,
        file: p.slug + ".md",
      }),
    );
  }

  write("sitemap.xml", sitemap(posts));
  write("feed.xml", feed(posts));
  return { posts, outDir };
}

module.exports = { build, SITE_URL, HOME_DESCRIPTION, OG_IMAGE };

if (require.main === module) {
  build()
    .then(({ posts, outDir }) => {
      console.log(
        `Built ${posts.length} post${posts.length === 1 ? "" : "s"} into ${path.relative(process.cwd(), outDir) || "."}/`,
      );
    })
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    });
}
