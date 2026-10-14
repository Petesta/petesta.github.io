"use strict";

// ── Utilities ──────────────────────────────────────────────────────────────
// escapeHtml, the page titles and the post HTML come from render.js, which loads first.

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── Buffer content ─────────────────────────────────────────────────────────

// The bio under the role (design about-page-variants-3.html, B). Wide screens get it in
// three lines broken where the meaning breaks, each shorter than the name art, so they
// never wrap again where the art fits; the compact home page gets it as one line that wraps.
const BIO = [
  "I develop scalable, resilient, and secure web applications,",
  "specializing in backend engineering, cloud architecture,",
  "DevOps, and functional programming.",
];
const BIO_LINES = new Set([...BIO, BIO.join(" ")]);

const BUFFER = {
  name: "index.html",
  content: [
    "██████╗ ███████╗████████╗███████╗     ██████╗██████╗ ██╗   ██╗███████╗",
    "██╔══██╗██╔════╝╚══██╔══╝██╔════╝    ██╔════╝██╔══██╗██║   ██║╚══███╔╝",
    "██████╔╝█████╗     ██║   █████╗      ██║     ██████╔╝██║   ██║  ███╔╝ ",
    "██╔═══╝ ██╔══╝     ██║   ██╔══╝      ██║     ██╔══██╗██║   ██║ ███╔╝  ",
    "██║     ███████╗   ██║   ███████╗    ╚██████╗██║  ██║╚██████╔╝███████╗",
    "╚═╝     ╚══════╝   ╚═╝   ╚══════╝     ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝",
    "",
    "Software Engineer",
    "",
    ...BIO,
    "",
    "%%SOCIAL%%",
    "%%POSTS%%",
  ].join("\\n"),
};

// Phones, and widths where the full art doesn't fit (design name-art-variants-2.html, V4c):
// the name as large text instead of art, with the role on the line right under it and
// the bio under that. %%NAME%% is drawn by renderBuffer.
const BUFFER_MOBILE = {
  name: "index.html",
  content: ["%%NAME%%", "Software Engineer", "", BIO.join(" "), "", "%%SOCIAL%%", "%%POSTS%%"].join(
    "\\n",
  ),
};
// How many empty ~ rows go above the name in that version: one, so the page starts near the top
const COMPACT_TOP_ROWS = 1;

// Placeholder buffers shown as tabs next to index.html
const stub = (title) => ["# " + title, "", "Coming soon."].join("\\n");

// Page titles (SITE_NAME, HOME_TITLE, titled() from render.js): the home page's matches
// <title> in index.html; the rest are "Page · Pete Cruz"
// Buffers in tab order. `mobile` replaces `content` at phone widths, and wherever
// the full content doesn't fit beside the tilde column (see VimSite.fullArtFits);
// `compactTop` is how many empty ~ rows go above it then (otherwise ~12% of the screen).
// `heading` is the buffer's <h1>: hidden on screen, read by screen readers and search engines.
const BUFFERS = [
  {
    name: "index.html",
    ft: "html",
    icon: "html5",
    content: BUFFER.content,
    mobile: BUFFER_MOBILE.content,
    compactTop: COMPACT_TOP_ROWS,
    heading: SITE_NAME,
    title: HOME_TITLE,
  },
  {
    name: "blog.md",
    ft: "markdown",
    icon: "markdown",
    content: stub("Blog"),
    title: titled("Blog"),
  },
  {
    name: "about.md",
    ft: "markdown",
    icon: "markdown",
    content: stub("About"),
    title: titled("About"),
  },
];

// index.html shows one page of posts at a time (render.js). Page 1 is the content
// above; later pages drop the name art and social links and show just their posts.
const HOME = {
  content: BUFFERS[0].content,
  mobile: BUFFERS[0].mobile,
  compactTop: BUFFERS[0].compactTop,
  heading: BUFFERS[0].heading,
  title: BUFFERS[0].title,
};
function homeBuffer(page) {
  return page === 1
    ? HOME
    : {
        content: ["", "%%POSTS%%"].join("\\n"),
        mobile: undefined,
        compactTop: undefined,
        heading: pageName(page),
        title: pageTitle(page),
      };
}

// Lines drawn in box characters (the name art). Screen readers and crawlers would read
// them out character by character, so they're hidden; the buffer's heading says the name in words.
const ART = /[█╔╗╚╝═║]/;

// The ~ column is decoration, so screen readers skip it
const TILDE = '<span class="line-num" aria-hidden="true">~</span>';

const _mq = window.matchMedia("(max-width: 600px)");
function bufferContent(buf, compact) {
  return compact && buf.mobile ? buf.mobile : buf.content;
}

// Room to keep between the tilde column and the full-width ASCII art
const ART_GAP = 4;

// ── Social links renderer ──────────────────────────────────────────────────

const _SVG = {
  github:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
  linkedin:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
  email:
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>',
  rss: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z"/></svg>',
};

function renderSocial() {
  const links = [
    { key: "ggh", label: "GitHub", href: "https://github.com/Petesta", icon: _SVG.github },
    { key: "gl", label: "LinkedIn", href: "https://linkedin.com/in/petecruz", icon: _SVG.linkedin },
    { key: "ge", label: "Email", href: "mailto:ipetesta@gmail.com", icon: _SVG.email },
    { key: "ggf", label: "RSS", href: "/feed.xml", icon: _SVG.rss },
  ];
  return (
    '<div class="social-row">' +
    links
      .map(
        (l) =>
          '<div class="social-btn-wrap">' +
          '<a class="social-btn" href="' +
          l.href +
          '" target="_blank" rel="noopener noreferrer" title="' +
          l.label +
          '">' +
          l.icon +
          "</a>" +
          '<span class="social-label">' +
          l.key +
          "</span>" +
          "</div>",
      )
      .join("") +
    "</div>"
  );
}

// ── Blog posts ─────────────────────────────────────────────────────────────

// POSTS comes from posts.js, which the build generates from posts/*.md (newest first).
// Posts open in one post tab, right after index.html; its HTML comes from render.js.
const BLOG_POSTS = typeof POSTS === "undefined" ? [] : POSTS;
const findPost = (slug) => BLOG_POSTS.find((p) => p.slug === slug);

// A post's address is /posts/<slug> (GitHub Pages also serves it as /posts/<slug>.html).
// Links from before the build used #/posts/<slug>; those still open the post.
const POST_PATH = /^\/posts\/([\w-]+?)(?:\.html)?$/;
const OLD_POST_HASH = /^#\/posts\/([\w-]+)$/;

// The post tab's place in the tabline, and its buffer for a post
const POST_TAB = 1;
const postBuffer = (slug) => ({ name: slug + ".md", ft: "markdown", icon: "markdown", post: slug });

// The post the address points at, or null for anything else (the home page)
function routedPost() {
  const m = location.pathname.match(POST_PATH) || location.hash.match(OLD_POST_HASH);
  return m && findPost(m[1]) ? m[1] : null;
}

// Later pages of the list are /page/<n> (or /page/<n>.html); anything else is page 1
const PAGE_PATH = /^\/page\/(\d+)(?:\.html)?$/;
function routedPage() {
  const m = location.pathname.match(PAGE_PATH);
  return m ? Math.min(Math.max(1, Number(m[1])), pageCount(BLOG_POSTS.length)) : 1;
}

const homePath = (path) => (path === "/index.html" ? "/" : path.replace(PAGE_PATH, "/page/$1"));

// ── Searching posts ────────────────────────────────────────────────────────
// The search bar lists the posts whose title, excerpt, tags or file name contain every
// word typed. A word starting with # only matches tags.
const searchWords = (q) => q.trim().toLowerCase().split(/\s+/).filter(Boolean);

function postMatches(p, words) {
  const hay = (p.title + " " + p.excerpt + " " + p.tags.join(" ") + " " + p.slug).toLowerCase();
  return words.every((w) =>
    w[0] === "#" ? p.tags.some((t) => t.toLowerCase().startsWith(w.slice(1))) : hay.includes(w),
  );
}

// The text, escaped, with the typed words in bold
function boldWords(text, words) {
  const ws = words.map((w) => w.replace(/^#/, "")).filter(Boolean);
  if (!ws.length) return escapeHtml(text);
  const re = new RegExp("(" + ws.map(escapeRegex).join("|") + ")", "gi");
  return text
    .split(re)
    .map((part, i) => (i % 2 ? "<b>" + escapeHtml(part) + "</b>" : escapeHtml(part)))
    .join("");
}

// ── Status line icons ──────────────────────────────────────────────────────

// Font Awesome Free 7.3.1 icons (CC BY 4.0, https://fontawesome.com/license/free),
// inlined as [viewBox, path] so the site doesn't load the Font Awesome bundle.
const _FA = {
  markdown: [
    "0 0 640 512",
    "M593.8 59.1l-547.6 0C20.7 59.1 0 79.8 0 105.2L0 406.7c0 25.5 20.7 46.2 46.2 46.2l547.7 0c25.5 0 46.2-20.7 46.1-46.1l0-301.6c0-25.4-20.7-46.1-46.2-46.1zM338.5 360.6l-61.5 0 0-120-61.5 76.9-61.5-76.9 0 120-61.7 0 0-209.2 61.5 0 61.5 76.9 61.5-76.9 61.5 0 0 209.2 .2 0zm135.3 3.1l-92.3-107.7 61.5 0 0-104.6 61.5 0 0 104.6 61.5 0-92.2 107.7z",
  ],
  html5: [
    "0 0 384 512",
    "M0 32L34.9 427.8 191.5 480 349.1 427.8 384 32 0 32zM308.2 159.9l-183.8 0 4.1 49.4 175.6 0-13.6 148.4-97.9 27 0 .3-1.1 0-98.7-27.3-6-75.8 47.7 0 3.5 38.1 53.5 14.5 53.7-14.5 6-62.2-166.9 0-12.8-145.6 241.1 0-4.4 47.7z",
  ],
  chrome: [
    "0 0 512 512",
    "M0 256c0-46.6 12.5-90.4 34.3-128.9L144.1 318.3c21.9 39.2 63.8 65.7 111.9 65.7 14.3 0 27.1-2.3 40.8-6.6L220.5 509.6C95.9 492.3 0 385.3 0 256zm365.1 65.6c12.3-19.2 18.9-42.5 18.9-65.6 0-38.2-16.8-72.5-43.3-96l152.7 0c12 29.6 18.6 62.1 18.6 96 0 141.4-114.6 255.1-256 256L365.1 321.6zM477.8 128L256 128c-62.9 0-113.7 44.1-125.5 102.7L54.2 98.5C101 38.5 174 0 256 0 350.8 0 433.5 51.5 477.8 128zM344 256a88 88 0 1 1 -176 0 88 88 0 1 1 176 0z",
  ],
  firefox: [
    "0 0 512 512",
    "M130.2 127.5l0 0zm351.4 45.4c-10.6-25.5-32.1-53-48.9-61.7 13.7 26.9 21.7 53.9 24.7 74 0 .1 0 .3 .1 .4-27.6-68.8-74.4-96.5-112.6-156.8-15-23.7-10.9-25.2-13.1-24.7l-.1 .1c-46.7 26-75.3 78.4-82.6 122.7-16.6 .9-32.9 5-47.9 12.1-1.4 .6-2.5 1.7-3.1 3s-.9 2.8-.6 4.3c.2 .8 .6 1.6 1.1 2.3s1.2 1.3 1.9 1.7 1.6 .7 2.4 .8 1.7 0 2.5-.3l.5-.2c15.5-7.3 32.4-11.2 49.5-11.3 62.8-.6 97.2 44 107.6 62.3-13-9.2-36.4-18.2-58.8-14.3 87.7 43.9 64.2 194.5-57.4 189.2-59.5-2.6-97.1-51-100.5-90.8 0 0 11.2-41.9 80.6-41.9 7.5 0 28.9-20.9 29.3-27-.1-2-42.5-18.9-59.1-35.2-8.8-8.7-13.1-12.9-16.8-16.1-2-1.7-4.1-3.3-6.3-4.8-5.6-19.5-5.8-40-.7-59.6-25.1 11.4-44.6 29.4-58.7 45.4l-.1 0c-9.7-12.2-9-52.6-8.4-61.1-.1-.5-7.2 3.7-8.2 4.3-8.6 6.1-16.5 12.9-23.8 20.4-16.3 16.6-44.1 50.2-55.5 101.2-4.5 20.4-6.8 44.4-6.8 52.3 0 134.7 109.2 243.9 243.9 243.9 120.6 0 223-87.2 240.4-202.6 11.6-76.7-14.7-131.1-14.7-132z",
  ],
  safari: [
    "0 0 512 512",
    "M274.7 274.7L237.3 237.3 166 346 274.7 274.7zM256 8a248 248 0 1 0 0 496 248 248 0 1 0 0-496zM411.8 182.8l14.8-6.1c1-.4 2-.6 3.1-.6s2.1 .2 3.1 .6 1.8 1 2.6 1.7 1.3 1.6 1.7 2.6 .6 2 .6 3.1-.2 2.1-.6 3.1-1 1.9-1.7 2.6-1.6 1.3-2.6 1.7L418 197.6c-2 .8-4.2 .8-6.1 0s-3.5-2.4-4.3-4.3-.8-4.2 0-6.1 2.4-3.5 4.3-4.3zM314.4 94l6.1-14.8c.8-2 2.4-3.5 4.3-4.3s4.2-.8 6.1 0 3.5 2.4 4.3 4.3 .8 4.2 0 6.1l-6.1 14.8c-.8 2-2.4 3.5-4.3 4.3s-4.2 .8-6.1 0c-1-.4-1.9-1-2.6-1.7s-1.3-1.6-1.7-2.6-.6-2-.6-3.1 .2-2.1 .6-3.1zM256 60c2.1 0 4.2 .8 5.7 2.3S264 65.9 264 68l0 16c0 2.1-.8 4.2-2.3 5.7s-3.5 2.3-5.7 2.3-4.2-.8-5.7-2.3-2.3-3.5-2.3-5.7l0-16c0-2.1 .8-4.2 2.3-5.7S253.9 60 256 60zM181 74.9c1-.4 2-.6 3.1-.6s2.1 .2 3.1 .6 1.9 1 2.6 1.7 1.3 1.6 1.7 2.6L197.6 94c.4 1 .7 2 .7 3.1s-.2 2.1-.6 3.1-1 1.9-1.7 2.6-1.6 1.4-2.6 1.8-2 .6-3.1 .6-2.1-.2-3.1-.6-1.9-1-2.6-1.8-1.3-1.7-1.7-2.7l-6.1-14.8c-.8-2-.8-4.2 0-6.1s2.4-3.5 4.3-4.3zm-63.6 42.5c1.5-1.5 3.5-2.3 5.7-2.3s4.2 .8 5.7 2.3L140 128.7c1.5 1.5 2.3 3.5 2.3 5.6s-.8 4.1-2.3 5.6c-1.5 1.5-3.5 2.3-5.7 2.3s-4.2-.8-5.7-2.3l-11.3-11.3c-1.5-1.5-2.3-3.5-2.3-5.6s.8-4.1 2.3-5.6l0 0zM60 256c0-2.1 .8-4.2 2.3-5.7S65.9 248 68 248l16 0c2.1 0 4.2 .8 5.7 2.3s2.3 3.5 2.3 5.7-.8 4.2-2.3 5.7-3.5 2.3-5.7 2.3l-16 0c-2.1 0-4.2-.8-5.7-2.3S60 258.1 60 256zm40.2 73.2l-14.8 6.1c-1 .4-2 .6-3.1 .6s-2.1-.2-3.1-.6-1.9-1-2.6-1.7-1.3-1.6-1.7-2.6-.6-2-.6-3.1 .2-2.1 .6-3.1 1-1.9 1.7-2.6 1.6-1.3 2.6-1.7L94 314.4c2-.8 4.2-.8 6.1 0s3.5 2.4 4.3 4.3 .8 4.2 0 6.1-2.4 3.5-4.3 4.3zm4.3-136c-.4 1-1 1.9-1.7 2.6s-1.6 1.3-2.6 1.7-2 .6-3.1 .6-2.1-.2-3.1-.6l-14.8-6.1c-2-.8-3.5-2.4-4.3-4.3s-.8-4.2 0-6.1 2.4-3.5 4.3-4.3 4.2-.8 6.1 0l14.8 6.1c2 .8 3.5 2.4 4.3 4.3s.8 4.2 0 6.1l0 0zM197.6 418l-6.1 14.8c-.4 1-1 1.9-1.7 2.6s-1.6 1.3-2.6 1.7-2 .6-3.1 .6-2.1-.2-3.1-.6-1.9-1-2.6-1.7-1.3-1.6-1.7-2.6-.6-2-.6-3.1 .2-2.1 .6-3.1l6.1-14.8c.4-1 1-1.9 1.7-2.7s1.6-1.4 2.6-1.8 2-.6 3.1-.6 2.1 .2 3.1 .6 1.9 1 2.6 1.8 1.3 1.7 1.7 2.6 .6 2 .6 3.1-.2 2.1-.7 3.1zM264 444c0 2.1-.8 4.2-2.3 5.7s-3.5 2.3-5.7 2.3-4.2-.8-5.7-2.3-2.3-3.5-2.3-5.7l0-16c0-2.1 .8-4.2 2.3-5.7s3.5-2.3 5.7-2.3 4.2 .8 5.7 2.3 2.3 3.5 2.3 5.7l0 16zm67-6.9c-1 .4-2 .6-3.1 .6s-2.1-.2-3.1-.6-1.9-1-2.6-1.7-1.3-1.6-1.7-2.6L314.4 418c-.8-2-.8-4.2 0-6.1s2.4-3.5 4.3-4.3 4.2-.8 6.1 0 3.5 2.4 4.3 4.3l6.1 14.8c.8 2 .8 4.2 0 6.1s-2.4 3.5-4.3 4.3zm63.6-42.5c-1.5 1.5-3.5 2.3-5.7 2.3s-4.2-.8-5.7-2.3L372 383.3c-1.5-1.5-2.3-3.5-2.3-5.6s.8-4.1 2.3-5.6 3.5-2.3 5.7-2.3 4.2 .8 5.7 2.3l11.3 11.3c1.5 1.5 2.3 3.5 2.3 5.6s-.8 4.1-2.3 5.6l0 0zM286.2 286.2L110.3 401.7 225.8 225.8 401.7 110.3 286.2 286.2zM437.1 331c-.8 2-2.4 3.5-4.3 4.3s-4.2 .8-6.1 0l-14.8-6.1c-2-.8-3.5-2.4-4.3-4.3s-.8-4.2 0-6.1c.4-1 1-1.9 1.7-2.6s1.6-1.3 2.6-1.7 2-.6 3.1-.6 2.1 .2 3.1 .6l14.8 6.1c2 .8 3.5 2.4 4.3 4.3s.8 4.2 0 6.1zm6.9-67l-16 0c-2.1 0-4.2-.8-5.7-2.3s-2.3-3.5-2.3-5.7 .8-4.2 2.3-5.7 3.5-2.3 5.7-2.3l16 0c2.1 0 4.2 .8 5.7 2.3s2.3 3.5 2.3 5.7-.8 4.2-2.3 5.7-3.5 2.3-5.7 2.3z",
  ],
  edge: [
    "0 0 512 512",
    "M120.1 37.4c41-25.2 87.6-38.2 134.9-37.4 168 0 257 123.8 257 219.5-.1 32.7-13 63.9-35.9 87.2-22.9 23.2-54 36.5-86.7 37-75.2 0-91.5-23.1-91.5-32 0-3.8 1.2-6.2 4.8-9.4l1-1.2 .4-1.6c10.5-11.5 15.9-26.2 15.9-41.6 0-78.7-82.2-142.7-184-142.7-37.5-.3-74.5 8.9-107.5 26.9 27-57.5 82.7-97.6 91.3-103.8 .8-.6 .3-.8 .3-.8zm15.6 318.1c-1.4 30 4.6 60 16.4 87.2 13.6 26.4 32.7 51 56.5 69.3-59.5-11.5-111.5-43.9-149.4-89.3-38.1-46.4-59.2-104.3-59.2-164.8 0-51.2 62.4-94.4 136-94.4 36.6-.6 72.4 10.9 101.8 32.7l-3.6 1.2c-51.5 17.6-98.5 90.7-98.5 158.1zM469.8 400l-.7 .1c-11.8 18.8-25.9 35.1-42.2 49.5-30.8 28-68.1 45.5-108.8 49.9-18.6 .3-36.8-3.2-53.8-11.4-25.6-10.3-47.1-30-61.6-53-14.4-23.9-21.1-51.7-19-79.6-.6-20.1 5.4-40.3 15-58.2 13.9 33.1 37.5 61.3 67.6 80.8s65.5 29.5 101.4 28.6c31 .3 62.1-6.7 90.2-20.5l1.9-.9c3.9-2.3 7.7-3.9 11.6 0 4.5 4.9 1.8 9.2-1.2 14-.2 .2-.3 .5-.4 .7z",
  ],
  opera: [
    "0 0 512 512",
    "M321.9 32.7c-170.2 0-252.6 223.8-147.5 355.1 36.5 45.4 88.6 75.6 147.5 75.6 36.3 0 70.3-11.1 99.4-30.4-43.8 39.2-101.9 63-165.3 63-3.9 0-8 0-11.9-.3-131.5-6.1-236.1-114.6-236.1-247.7 0-137 111-248 248-248l.8 0c63.1 .3 120.7 24.1 164.4 63.1-29-19.4-63.1-30.4-99.3-30.4zM423.7 430.4c-40.9 24.7-90.7 23.6-132-5.8 56.2-20.5 97.7-91.6 97.7-176.6 0-84.7-41.2-155.8-97.4-176.6 41.8-29.2 91.2-30.3 132.9-5 105.9 98.7 105.5 265.7-1.2 364z",
  ],
  brave: [
    "0 0 448 512",
    "M145.6 0l157 0 44.7 50.8s39.3-10.9 57.8 7.6 33.8 34.9 33.8 34.9l-12 29.5 15.3 43.7s-44.9 170.2-50.1 191c-10.4 40.9-17.4 56.8-46.9 77.5s-82.9 56.8-91.6 62.2c-1.9 1.2-3.9 2.5-5.9 3.9-7.5 5.1-15.8 10.8-23.5 10.8s-16.1-5.7-23.5-10.8c-2-1.4-4-2.8-5.9-3.9-8.7-5.5-62.1-41.5-91.6-62.2s-36.5-36.6-46.9-77.5c-5.3-20.8-50.1-191-50.1-191L21.5 122.8 9.3 93.3s15.3-16.4 33.8-34.9 57.8-7.6 57.8-7.6L145.6 0zm78.5 407.6c3.7 0 8.9-4.7 13-8.4 .6-.5 1.2-1.1 1.7-1.5 4.2-3.7 47.8-37.5 51-39.8s5.4-6.5 1.9-8.7c-2.8-1.7-10-5.5-20.3-10.8-3-1.6-6.3-3.2-9.7-5-15.4-8-34.5-14.7-37.5-14.7s-22.1 6.8-37.5 14.7c-3.5 1.8-6.7 3.5-9.7 5-10.3 5.3-17.6 9.1-20.3 10.8-3.6 2.2-1.4 6.4 1.9 8.7s46.8 36.1 51 39.8c.5 .5 1.1 1 1.7 1.5 4.1 3.7 9.3 8.4 13 8.4l-.2 0zm0-165.7c4.7 0 17.6-3 26.4-5l2-.5c7.8-1.8 7.3-6.3 6.4-13-.1-.8-.2-1.6-.3-2.4-.6-6.1-5.8-33.1-9.1-50.3-1.1-5.8-2-10.5-2.4-12.9-1.5-8.1-.6-9.4 .7-11.3 .2-.3 .5-.7 .7-1.1 1.4-2.3 16-6.2 27.9-9.5 2.5-.7 4.8-1.3 6.9-1.9 10.6-3 32.4-.6 44.2 .6 1.8 .2 3.4 .4 4.7 .5 9.6 .9 10.4 2.3 7.2 3.8-2.3 1.1-16.2 6.3-28.7 10.9-4.7 1.8-9.2 3.5-12.8 4.8-1.5 .5-3 1.1-4.5 1.7-12.5 4.6-27.2 10-28.9 19.4-1.5 8.3 5.2 19.9 11.3 30.3 1.6 2.8 3.2 5.5 4.6 8.1 6.3 11.9 6.5 13.3 6.1 18.1-.4 3.9-14.5 12.7-22.4 17.6-1.8 1.1-3.3 2.1-4.2 2.7-.8 .5-2.1 1.4-3.8 2.4-8.6 5.2-26.3 16-26.3 22.5 0 7.8 24.6 28.1 32.4 33.2s28.9 16.1 37.9 17.8 23-8.5 31.2-23.8c7.7-14.4 1.7-28.5-3.2-40l-.9-2.2c-4.5-10.6 1.9-17 6.2-21.3 .5-.5 1-1 1.4-1.4l43-45.7c1.3-1.3 2.5-2.6 3.7-3.8 5.8-5.7 10.8-10.5 10.8-22.8 0-14.9-57.5-84.5-57.5-84.5s-48.5 9.3-55.1 9.3c-5.2 0-15.3-3.5-25.8-7.1-2.7-.9-5.4-1.9-8-2.7-13-4.3-21.8-4.4-21.8-4.4s-8.7 0-21.8 4.4c-2.7 .9-5.4 1.8-8 2.7-10.5 3.6-20.6 7.1-25.8 7.1-6.5 0-55.1-9.3-55.1-9.3s-57.5 69.6-57.5 84.5c0 12.3 4.9 17.1 10.8 22.8 1.2 1.2 2.5 2.4 3.7 3.8l43.1 45.8c.4 .5 .9 .9 1.4 1.4 4.3 4.3 10.6 10.7 6.2 21.3l-.9 2.2c-4.9 11.5-11 25.6-3.2 40 8.2 15.3 22.2 25.5 31.2 23.8s30.1-12.7 37.9-17.8 32.4-25.4 32.4-33.2c0-6.5-17.7-17.3-26.3-22.5-1.7-1-3.1-1.9-3.8-2.4-.9-.6-2.4-1.5-4.2-2.7-7.9-4.9-22-13.7-22.4-17.6-.4-4.8-.3-6.2 6.1-18.1 1.3-2.5 2.9-5.3 4.6-8.1 6-10.4 12.8-22 11.3-30.3-1.7-9.4-16.4-14.8-28.9-19.4-1.6-.6-3.1-1.1-4.5-1.7-3.6-1.4-8.1-3.1-12.8-4.8l-.1 0c-12.5-4.7-26.4-9.9-28.7-10.9-3.2-1.5-2.3-2.8 7.2-3.8 1.3-.1 2.9-.3 4.7-.5 11.8-1.3 33.6-3.6 44.2-.6 2.1 .6 4.4 1.2 6.9 1.9 11.9 3.2 26.5 7.2 27.9 9.5 .2 .4 .5 .7 .7 1.1 1.3 1.9 2.2 3.2 .7 11.3-.4 2.4-1.3 7.1-2.4 12.9-3.3 17.2-8.5 44.2-9.1 50.3-.1 .8-.2 1.7-.3 2.4-.8 6.7-1.4 11.2 6.4 13l2 .5c8.8 2 21.8 5 26.4 5l0-.1z",
  ],
  yandex: [
    "0 0 320 512",
    "M129.5 512l0-166.1-111-297.9 55.8 0 81.8 229.7 94.1-277.7 51.3 0-120.7 347.8 0 164.2-51.3 0z",
  ],
  default: [
    "0 0 512 512",
    "M351.9 280l-190.9 0c2.9 64.5 17.2 123.9 37.5 167.4 11.4 24.5 23.7 41.8 35.1 52.4 11.2 10.5 18.9 12.2 22.9 12.2s11.7-1.7 22.9-12.2c11.4-10.6 23.7-28 35.1-52.4 20.3-43.5 34.6-102.9 37.5-167.4zM160.9 232l190.9 0C349 167.5 334.7 108.1 314.4 64.6 303 40.2 290.7 22.8 279.3 12.2 268.1 1.7 260.4 0 256.4 0s-11.7 1.7-22.9 12.2c-11.4 10.6-23.7 28-35.1 52.4-20.3 43.5-34.6 102.9-37.5 167.4zm-48 0C116.4 146.4 138.5 66.9 170.8 14.7 78.7 47.3 10.9 131.2 1.5 232l111.4 0zM1.5 280c9.4 100.8 77.2 184.7 169.3 217.3-32.3-52.2-54.4-131.7-57.9-217.3L1.5 280zm398.4 0c-3.5 85.6-25.6 165.1-57.9 217.3 92.1-32.7 159.9-116.5 169.3-217.3l-111.4 0zm111.4-48C501.9 131.2 434.1 47.3 342 14.7 374.3 66.9 396.4 146.4 399.9 232l111.4 0z",
  ],
};

function faIcon(key) {
  const [viewBox, d] = _FA[key];
  return (
    '<svg viewBox="' +
    viewBox +
    '" fill="currentColor" aria-hidden="true"><path d="' +
    d +
    '"/></svg>'
  );
}

const BROWSER_NAMES = {
  chrome: "Chrome",
  firefox: "Firefox",
  safari: "Safari",
  edge: "Edge",
  opera: "Opera",
  brave: "Brave",
  yandex: "Yandex",
  default: "Browser",
};

// Order matters: Edge, Opera, Yandex and Brave all include "Chrome" in their UA,
// and every iOS browser includes "Safari". Brave hides itself in the UA, so it's
// detected through navigator.brave instead. Browsers that identify themselves but
// have no Font Awesome icon get the default icon rather than Chrome's or Safari's.
function detectBrowser(ua = navigator.userAgent, nav = navigator) {
  if (nav && nav.brave) return "brave";
  if (/SamsungBrowser\/|Vivaldi\/|DuckDuckGo\/|Ddg\/|UCBrowser\//.test(ua)) return "default";
  if (/Edg(e|A|iOS)?\//.test(ua)) return "edge";
  if (/OPR\/|OPT\/|Opera/.test(ua)) return "opera";
  if (/YaBrowser\//.test(ua)) return "yandex";
  if (/Firefox\/|FxiOS\//.test(ua)) return "firefox";
  if (/Chrome\/|CriOS\//.test(ua)) return "chrome";
  if (/Safari\//.test(ua)) return "safari";
  return "default";
}

// ── VimSite ────────────────────────────────────────────────────────────────

class VimSite {
  constructor() {
    this.mode = "NORMAL";
    this.active = 0; // index into BUFFERS
    this.listPage = 1; // the page of posts index.html shows
    this.compact = false; // showing a buffer's `mobile` content
    this.keyState = "IDLE"; // IDLE | G1 | GG
    this.keyTimer = null;
    this.GG_TIMEOUT = 600;
    this.G1_TIMEOUT = 2000;
    this.searchQuery = "";
    this.searchMatches = [];
    this.searchCursor = 0;

    this.contentEl = document.getElementById("content");
    this.tablineEl = document.getElementById("tabline");
    this.statusEl = document.getElementById("statusline");
    this.browserEl = document.getElementById("sl-browser");
    this.ftIconEl = document.getElementById("sl-ft-icon");
    this.ftLabelEl = document.getElementById("sl-ft-label");
    this.modeEl = document.getElementById("mode-indicator");
    this.fileEl = document.getElementById("sl-filename");
    this.posEl = document.getElementById("sl-pos");
    this.pctEl = document.getElementById("sl-pct");
    this.winbarEl = document.getElementById("winbar");
    this.searchEl = document.getElementById("search");
    this.listEl = document.getElementById("search-list");
    this.countEl = document.getElementById("search-count");
    this.results = []; // the posts the search list shows
    this.sel = -1; // the selected one, or -1

    this.init();
  }

  init() {
    // Loaded at a post's address: open its tab before anything is drawn, so the
    // tabline and statusline are right from the first paint
    const slug = routedPost();
    if (slug) {
      this.active = this.addPostBuffer(slug);
      if (location.hash) this.replaceUrl("/posts/" + slug); // old #/posts/ link: show the new address
    } else {
      this.setListPage(routedPage());
    }
    this.renderStatusIcons();
    this.renderTabline();
    this.tablineEl.addEventListener("click", (e) => {
      if (e.target.closest(".tab-close")) {
        this.closePost();
        return;
      }
      const tab = e.target.closest(".tab");
      if (tab) this.switchBuffer(Number(tab.dataset.i));
    });
    new ResizeObserver(() => this.revealActiveTab()).observe(this.tablineEl);
    document.addEventListener("keydown", (e) => this.onKeyDown(e));
    this.setUpSearchBar();
    this.contentEl.addEventListener("scroll", () => this.updateStatus(), { passive: true });
    this.contentEl.addEventListener("click", (e) => {
      // A tag searches for itself; on the home page it's inside the card's link, so it's
      // checked first and the post doesn't open
      const tag = e.target.closest(".post-tags [data-tag]");
      if (tag) {
        e.preventDefault();
        this.searchTag(tag.dataset.tag);
        return;
      }
      const a = e.target.closest("a");
      if (a && a.dataset.slug) {
        e.preventDefault();
        this.openPost(a.dataset.slug);
        return;
      }
      if (a && a.dataset.page) {
        e.preventDefault();
        this.showListPage(Number(a.dataset.page));
        return;
      }
      if (a && a.href) {
        const url = new URL(a.href);
        this.fileEl.textContent = url.pathname.split("/").pop() || a.href;
      }
    });
    // On resize, swap between the full and compact content when the full one stops
    // (or starts) fitting; otherwise just refill the tildes. Posts are the same at
    // every width, so they keep their place instead of jumping to the top.
    const onResize = () => {
      if (BUFFERS[this.active].post) return;
      if (this.wantsCompact() !== this.compact) this.renderBuffer();
      else this.fillTildes();
    };
    new ResizeObserver(onResize).observe(this.contentEl);
    _mq.addEventListener("change", onResize);
    // Back and forward move between posts and the home page
    window.addEventListener("popstate", () => this.followRoute());
    window.addEventListener("hashchange", () => this.followRoute());
    document.fonts.ready.then(() => {
      this.renderBuffer();
      this.updateStatus();
      this.followRoute();
    });
  }

  // Typing a search happens in the search bar, which handles its own keys
  onKeyDown(e) {
    if (e.altKey || e.metaKey) return;
    const el = document.activeElement;
    if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT"))
      return;
    this.handleNormal(e);
  }

  handleNormal(e) {
    const k = e.key;
    if (e.ctrlKey) {
      if (["d", "u", "f", "b", "D", "U", "F", "B"].includes(k)) {
        e.preventDefault();
        if (this.keyState === "IDLE") this.handleCtrl(k.toLowerCase());
      }
      return;
    }
    if (["j", "k", "g", "G", "/", "n", "N", "Escape", "ArrowUp", "ArrowDown"].includes(k))
      e.preventDefault();
    if (this.keyState === "IDLE") this.handleIdle(k);
    else if (this.keyState === "G1") {
      e.preventDefault();
      this.handleG1(k);
    } else if (this.keyState === "GG") {
      e.preventDefault();
      this.handleGG(k);
    }
  }

  handleCtrl(k) {
    const half = this.contentEl.clientHeight / 2;
    const full = this.contentEl.clientHeight;
    if (k === "d") {
      this.scrollBy(half);
    } else if (k === "u") {
      this.scrollBy(-half);
    } else if (k === "f") {
      this.scrollBy(full);
    } else if (k === "b") {
      this.scrollBy(-full);
    }
  }

  handleIdle(k) {
    switch (k) {
      case "j":
        this.scrollBy(80);
        break;
      case "ArrowDown":
        this.scrollBy(80);
        break;
      case "k":
        this.scrollBy(-80);
        break;
      case "ArrowUp":
        this.scrollBy(-80);
        break;
      case "G":
        this.scrollToBottom();
        break;
      case "g":
        this.keyState = "G1";
        this.keyTimer = setTimeout(() => {
          this.resetKeys();
        }, this.G1_TIMEOUT);
        break;
      case "/":
        this.enterSearch();
        break;
      case "n":
        this.nextMatch();
        break;
      case "N":
        this.prevMatch();
        break;
      case "Escape":
        this.clearSearch();
        break;
    }
  }

  handleG1(k) {
    clearTimeout(this.keyTimer);
    switch (k) {
      case "g":
        this.keyState = "GG";
        this.keyTimer = setTimeout(() => {
          this.scrollToTop();
          this.resetKeys();
        }, this.GG_TIMEOUT);
        break;
      case "t":
        this.switchBuffer(this.active + 1);
        this.resetKeys();
        break;
      case "T":
        this.switchBuffer(this.active - 1);
        this.resetKeys();
        break;
      case "l":
        window.open("https://linkedin.com/in/petecruz", "_blank", "noopener,noreferrer");
        this.resetKeys();
        break;
      case "e":
        window.open("mailto:ipetesta@gmail.com", "_blank", "noopener,noreferrer");
        this.resetKeys();
        break;
      default:
        this.resetKeys();
        break;
    }
  }

  handleGG(k) {
    clearTimeout(this.keyTimer);
    const LINKS = {
      h: ["ggh", "https://github.com/Petesta"],
      f: ["ggf", "/feed.xml"],
    };

    if (LINKS[k]) {
      const [, url] = LINKS[k];
      window.open(url, "_blank", "noopener,noreferrer");
    }
    this.resetKeys();
  }

  // ── Search bar ───────────────────────────────────────────────────────────
  // Focusing the bar (/ or a click) is SEARCH mode. While you type, the posts that match
  // are listed under the bar, and the text on the page is highlighted, as / does in Vim.
  // Arrow keys or Tab pick a post and Enter opens it; Enter with no post picked goes to
  // the first match on the page, and n / N move between matches. Esc clears the search.
  setUpSearchBar() {
    const bar = this.searchEl;
    bar.addEventListener("focus", () => {
      this.mode = "SEARCH";
      this.sel = -1;
      this.renderResults();
      this.updateStatus();
    });
    // Clicking or tapping anywhere else leaves the query and its highlights, like Enter
    bar.addEventListener("blur", () => {
      if (this.mode !== "SEARCH") return;
      this.mode = "NORMAL";
      this.renderResults();
      this.updateStatus();
    });
    bar.addEventListener("input", () => {
      this.searchQuery = bar.value;
      this.sel = -1;
      this.doSearch();
      this.renderResults();
    });
    bar.addEventListener("keydown", (e) => this.onSearchKey(e));
    // The magnifier and the rest of the bar focus the field too
    this.winbarEl.addEventListener("mousedown", (e) => {
      if (e.target !== bar) {
        e.preventDefault();
        bar.focus({ preventScroll: true });
      }
    });
    // Choosing a post mustn't take focus from the field first
    this.listEl.addEventListener("mousedown", (e) => e.preventDefault());
    this.listEl.addEventListener("click", (e) => {
      const item = e.target.closest(".sr-item");
      if (item) this.openResult(Number(item.dataset.i));
    });
  }

  onSearchKey(e) {
    const k = e.key,
      n = this.results.length;
    if (k === "Escape") {
      e.preventDefault();
      this.clearSearch();
    } else if (k === "Enter") {
      e.preventDefault();
      if (this.sel >= 0) this.openResult(this.sel);
      else this.finishSearch();
    } else if (
      n &&
      (k === "ArrowDown" || (k === "Tab" && !e.shiftKey) || (e.ctrlKey && k === "n"))
    ) {
      e.preventDefault();
      this.moveSel(1);
    } else if (n && (k === "ArrowUp" || (k === "Tab" && e.shiftKey) || (e.ctrlKey && k === "p"))) {
      e.preventDefault();
      this.moveSel(-1);
    }
  }

  // Next or previous post in the list, wrapping around
  moveSel(d) {
    const n = this.results.length;
    this.sel = this.sel < 0 ? (d > 0 ? 0 : n - 1) : (this.sel + d + n) % n;
    this.renderResults();
  }

  openResult(i) {
    const p = this.results[i];
    if (!p) return;
    this.clearSearch();
    this.openPost(p.slug);
  }

  // Enter without a post picked: leave the bar and go to the first match on the page
  finishSearch() {
    if (!this.searchQuery.trim()) {
      this.clearSearch();
      return;
    }
    this.mode = "NORMAL";
    this.searchEl.blur();
    this.renderResults();
    this.updateStatus();
    this.searchCursor = 0;
    this.scrollToMatch(0);
  }

  // / starts a new search, as in Vim
  enterSearch() {
    this.clearHighlights();
    this.searchQuery = "";
    this.searchMatches = [];
    this.searchCursor = 0;
    this.searchEl.value = "";
    this.searchEl.focus({ preventScroll: true });
  }

  // A tag click (design tag-click-variants.html, option 2): the same as pressing / and
  // typing #tag. The list opens over whatever is showing, a post included, and Esc
  // closes it and leaves you where you were.
  searchTag(tag) {
    this.enterSearch();
    this.searchEl.value = "#" + tag;
    this.searchQuery = this.searchEl.value;
    this.sel = -1;
    this.doSearch();
    this.renderResults();
  }

  clearSearch() {
    this.mode = "NORMAL";
    this.searchQuery = "";
    this.searchMatches = [];
    this.searchCursor = 0;
    this.searchEl.value = "";
    this.sel = -1;
    this.clearHighlights();
    if (document.activeElement === this.searchEl) this.searchEl.blur();
    this.renderResults();
    this.updateStatus();
  }

  // The list under the bar, open while the bar is in use. Before anything is typed it
  // has every post; nothing matching shows Vim's "not found" message.
  renderResults() {
    const open = this.mode === "SEARCH";
    this.winbarEl.dataset.state = open ? "search" : "idle";
    this.searchEl.setAttribute("aria-expanded", String(open));
    if (!open) {
      this.listEl.hidden = true;
      this.countEl.textContent = "";
      this.searchEl.removeAttribute("aria-activedescendant");
      return;
    }
    const words = searchWords(this.searchQuery);
    this.results = BLOG_POSTS.filter((p) => postMatches(p, words));
    this.countEl.textContent = words.length ? this.results.length + " of " + BLOG_POSTS.length : "";
    this.listEl.innerHTML = this.results.length
      ? this.results
          .map(
            (p, i) =>
              '<div class="sr-item' +
              (i === this.sel ? " sel" : "") +
              '" id="sr-' +
              i +
              '" role="option" aria-selected="' +
              (i === this.sel) +
              '" data-i="' +
              i +
              '">' +
              '<span class="sr-file">' +
              boldWords(p.slug, words) +
              ".md</span>" +
              '<span class="sr-title">' +
              boldWords(p.title, words) +
              "</span>" +
              "</div>",
          )
          .join("")
      : '<div class="sr-none">E486: Pattern not found: ' +
        escapeHtml(this.searchQuery.trim()) +
        "</div>";
    this.listEl.hidden = false;
    if (this.sel >= 0) {
      this.searchEl.setAttribute("aria-activedescendant", "sr-" + this.sel);
      this.listEl.querySelector(".sel").scrollIntoView({ block: "nearest" });
    } else {
      this.searchEl.removeAttribute("aria-activedescendant");
    }
  }

  doSearch() {
    this.clearHighlights();
    this.searchMatches = [];
    if (!this.searchQuery) return;
    const re = new RegExp(escapeRegex(this.searchQuery), "gi");
    // Buffer lines, or the article when a post is showing
    this.contentEl.querySelectorAll(".line-content, .post-view").forEach((lineEl) => {
      re.lastIndex = 0;
      if (re.test(lineEl.textContent)) {
        this.highlightInElement(lineEl);
        lineEl
          .querySelectorAll("mark.search-highlight")
          .forEach((mark) => this.searchMatches.push(mark));
      }
    });
    if (this.searchMatches.length > 0) {
      this.searchCursor = 0;
      this.scrollToMatch(0);
    }
  }

  highlightInElement(el) {
    const re = new RegExp(escapeRegex(this.searchQuery), "gi");
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach((textNode) => {
      const text = textNode.nodeValue;
      re.lastIndex = 0;
      if (!re.test(text)) return;
      const frag = document.createDocumentFragment();
      re.lastIndex = 0;
      let last = 0,
        m;
      while ((m = re.exec(text)) !== null) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        const mark = document.createElement("mark");
        mark.className = "search-highlight";
        mark.textContent = m[0];
        frag.appendChild(mark);
        last = m.index + m[0].length;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  clearHighlights() {
    this.contentEl
      .querySelectorAll("mark.search-highlight")
      .forEach((mark) => mark.replaceWith(document.createTextNode(mark.textContent)));
    this.contentEl.normalize();
  }

  scrollToMatch(idx) {
    if (!this.searchMatches.length) return;
    this.contentEl
      .querySelectorAll("mark.search-highlight.current")
      .forEach((m) => m.classList.remove("current"));
    const mark = this.searchMatches[idx];
    if (!mark) return;
    mark.classList.add("current");
    mark.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  nextMatch() {
    if (!this.searchMatches.length) return;
    this.searchCursor = (this.searchCursor + 1) % this.searchMatches.length;
    this.scrollToMatch(this.searchCursor);
  }

  prevMatch() {
    if (!this.searchMatches.length) return;
    this.searchCursor =
      (this.searchCursor - 1 + this.searchMatches.length) % this.searchMatches.length;
    this.scrollToMatch(this.searchCursor);
  }

  renderBuffer() {
    const buf = BUFFERS[this.active];
    document.title = buf.post ? titled(findPost(buf.post).title) : buf.title;
    this.contentEl.classList.toggle("reading", !!buf.post);
    if (buf.post) {
      this.contentEl.innerHTML = renderPost(findPost(buf.post), BLOG_POSTS);
      this.contentEl.scrollTop = 0;
      this.updateStatus();
      if (this.searchQuery) this.doSearch();
      return;
    }
    this.compact = this.wantsCompact();
    const lines = bufferContent(buf, this.compact)
      .split("\\n")
      .map((raw, i) => {
        const n = i + 1;
        if (raw === "%%NAME%%") {
          // The name as large text. Like the art, it's decoration: the hidden <h1> says the
          // name to screen readers. It's two rows tall, so the ~ column keeps its rhythm.
          return (
            '<div class="line name-line" data-line="' +
            n +
            '" aria-hidden="true"><span class="line-content">' +
            escapeHtml(SITE_NAME) +
            "</span></div>"
          );
        }
        if (raw === "%%SOCIAL%%") {
          return '<div class="line social-line" data-line="' + n + '">' + renderSocial() + "</div>";
        }
        if (raw === "%%POSTS%%") {
          return (
            '<div class="line posts-line" data-line="' +
            n +
            '">' +
            renderList(BLOG_POSTS, this.listPage) +
            "</div>"
          );
        }
        if (BIO_LINES.has(raw)) {
          // The bio wraps on narrow screens, so like the blocks below it gets a ~ for
          // every row it takes up (fillTildes) instead of one
          return (
            '<div class="line bio-line" data-line="' +
            n +
            '"><span class="line-content">' +
            escapeHtml(raw) +
            "</span></div>"
          );
        }
        const hidden = ART.test(raw) ? ' aria-hidden="true"' : "";
        return (
          '<div class="line" data-line="' +
          n +
          '"' +
          hidden +
          ">" +
          TILDE +
          '<span class="line-content">' +
          (raw.trim() === "" ? "\u00a0" : escapeHtml(raw)) +
          "</span>" +
          "</div>"
        );
      })
      .join("");
    const heading = buf.heading
      ? '<h1 class="visually-hidden">' + escapeHtml(buf.heading) + "</h1>"
      : "";
    this.contentEl.innerHTML = heading + lines;
    this.contentEl.scrollTop = 0;
    this.fillTildes();
    this.updateStatus();
    if (this.searchQuery) this.doSearch();
  }

  // Phones always get the compact content. Wider screens get it only when the
  // full content wouldn't fit.
  wantsCompact() {
    const buf = BUFFERS[this.active];
    if (!buf.mobile) return false;
    return _mq.matches || !this.fullArtFits(buf);
  }

  // Lay out the widest line of the full content as a hidden buffer line and check
  // it stays on one line and clears the tilde column. Measuring the real layout,
  // rather than doing arithmetic on widths, keeps this right in every browser.
  fullArtFits(buf) {
    const widest = buf.content.split("\\n").reduce((a, b) => (b.length > a.length ? b : a), "");
    const probe = document.createElement("div");
    probe.className = "line";
    probe.style.visibility = "hidden";
    probe.setAttribute("aria-hidden", "true");
    probe.innerHTML = '<span class="line-num">~</span><span class="line-content"></span>';
    probe.lastChild.textContent = widest;
    this.contentEl.appendChild(probe);
    const range = document.createRange();
    range.selectNodeContents(probe.lastChild);
    const rects = [...range.getClientRects()].filter((r) => r.width > 0);
    const gutterRight = probe.firstChild.getBoundingClientRect().right;
    const box = this.contentEl.getBoundingClientRect();
    probe.remove();
    if (!rects.length) return true;
    const oneLine = rects.every((r) => Math.abs(r.top - rects[0].top) < 1);
    const left = Math.min(...rects.map((r) => r.left));
    const right = Math.max(...rects.map((r) => r.right));
    return (
      oneLine && left >= gutterRight + ART_GAP && right <= box.left + this.contentEl.clientWidth
    );
  }

  fillTildes() {
    this.contentEl.querySelectorAll(".tilde-filler").forEach((el) => el.remove());
    if (BUFFERS[this.active].post) return; // posts have no tilde column
    const lh = parseFloat(getComputedStyle(this.contentEl).lineHeight) || 22.4;

    // The name, the bio, the social links and the posts can be taller than one line, so
    // give each block its own column of ~ rows, one per line height, covering its full height.
    for (const block of this.contentEl.querySelectorAll(
      ".name-line, .bio-line, .social-line, .posts-line",
    )) {
      block.querySelector(".block-gutter")?.remove();
      const rows = Math.ceil(block.getBoundingClientRect().height / lh);
      const gutter = document.createElement("div");
      gutter.className = "block-gutter";
      gutter.setAttribute("aria-hidden", "true");
      for (let i = 0; i < rows; i++) {
        const t = document.createElement("div");
        t.style.height = lh + "px";
        t.textContent = "~";
        gutter.appendChild(t);
      }
      block.appendChild(gutter);
    }

    const ch = this.contentEl.clientHeight;

    // Prepend top tilde rows (~12% of viewport height) so tildes span full screen.
    // The compact home page keeps just a row, so its content starts near the top.
    const buf = BUFFERS[this.active];
    const topRows =
      this.compact && buf.compactTop !== undefined ? buf.compactTop : Math.round((ch * 0.12) / lh);
    const topFrag = document.createDocumentFragment();
    for (let i = 0; i < topRows; i++) {
      const div = document.createElement("div");
      div.className = "line tilde-filler";
      div.setAttribute("aria-hidden", "true");
      div.innerHTML = TILDE;
      topFrag.appendChild(div);
    }
    this.contentEl.insertBefore(topFrag, this.contentEl.firstChild);

    // Fill remaining space below content with bottom tilde rows.
    // contentHeight now includes the top fillers we just inserted.
    let contentHeight = 0;
    for (const child of this.contentEl.children) {
      if (child.classList.contains("visually-hidden")) continue; // the hidden heading takes no room
      contentHeight += child.getBoundingClientRect().height;
    }
    const extra = Math.ceil(Math.max(0, ch - contentHeight) / lh);
    if (extra <= 0) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < extra; i++) {
      const div = document.createElement("div");
      div.className = "line tilde-filler";
      div.setAttribute("aria-hidden", "true");
      div.innerHTML = TILDE;
      frag.appendChild(div);
    }
    this.contentEl.appendChild(frag);
  }

  scrollBy(px) {
    this.contentEl.scrollBy({ top: px, behavior: "smooth" });
  }
  scrollToTop() {
    this.contentEl.scrollTo({ top: 0, behavior: "smooth" });
  }
  scrollToBottom() {
    this.contentEl.scrollTo({ top: this.contentEl.scrollHeight, behavior: "smooth" });
  }

  renderStatusIcons() {
    const browser = detectBrowser();
    this.browserEl.innerHTML = faIcon(browser);
    this.browserEl.dataset.browser = browser;
    this.browserEl.setAttribute("aria-label", BROWSER_NAMES[browser]);
    this.browserEl.title = BROWSER_NAMES[browser];
    const buf = BUFFERS[this.active];
    this.ftIconEl.innerHTML = faIcon(buf.icon);
    this.ftIconEl.dataset.icon = buf.icon;
  }

  // The post tab is followed by its close button, which draws the tab's point
  renderTabline() {
    this.tablineEl.innerHTML = BUFFERS.map(
      (buf, i) =>
        '<button type="button" class="tab' +
        (buf.post ? " closable" : "") +
        '" data-i="' +
        i +
        '" aria-label="' +
        buf.name +
        '">' +
        '<span class="tab-icon" data-icon="' +
        buf.icon +
        '">' +
        faIcon(buf.icon) +
        "</span>" +
        '<span class="tab-label">' +
        buf.name +
        "</span>" +
        "</button>" +
        (buf.post
          ? '<button type="button" class="tab-close" aria-label="Close ' +
            buf.name +
            '" title="Close"><span aria-hidden="true">×</span></button>'
          : ""),
    ).join("");
    this.markActiveTab();
  }

  markActiveTab() {
    this.tablineEl.querySelectorAll(".tab").forEach((tab, i) => {
      tab.classList.toggle("on", i === this.active);
      if (i === this.active) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
    });
    this.revealActiveTab();
  }

  // Like Vim, scroll the tab line so the active tab is never cut off
  revealActiveTab() {
    const strip = this.tablineEl;
    const on = strip.querySelector(".tab.on");
    if (!on) return;
    const left = on.offsetLeft,
      right = left + on.offsetWidth;
    if (right > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = right - strip.clientWidth;
    else if (left < strip.scrollLeft) strip.scrollLeft = left;
  }

  // gt / gT and tab clicks; wraps around at both ends like Vim
  switchBuffer(i) {
    const n = BUFFERS.length;
    i = ((i % n) + n) % n;
    if (i === this.active) return;
    this.active = i;
    this.markActiveTab();
    this.renderBuffer();
    this.syncRoute();
  }

  // Which page of posts index.html shows; its content, heading and title change with it
  setListPage(page) {
    this.listPage = page;
    Object.assign(BUFFERS[0], homeBuffer(page));
  }

  // Go to a page of posts, as the pager's links do: in the index.html tab, from the top
  showListPage(page) {
    page = Math.min(Math.max(1, page), pageCount(BLOG_POSTS.length));
    if (page === this.listPage && this.active === 0) return;
    this.setListPage(page);
    if (this.active !== 0) {
      this.switchBuffer(0);
      return;
    }
    this.renderBuffer();
    this.syncRoute();
  }

  // Every post opens in the one post tab, right after index.html: the first post adds
  // the tab, and later ones (the list, search, the newer and older links, back and
  // forward) show in it in place of the post before.
  openPost(slug) {
    if (!findPost(slug)) return;
    const i = BUFFERS.findIndex((b) => b.post);
    if (i < 0) {
      if (this.active >= POST_TAB) this.active++;
      this.addPostBuffer(slug);
      this.renderTabline();
    } else if (BUFFERS[i].post !== slug) {
      Object.assign(BUFFERS[i], postBuffer(slug));
      this.renderTabline();
      if (this.active === i) {
        this.renderBuffer();
        this.syncRoute();
        return;
      }
    }
    this.switchBuffer(POST_TAB);
  }

  // Add the post tab; returns its index
  addPostBuffer(slug) {
    BUFFERS.splice(POST_TAB, 0, postBuffer(slug));
    return POST_TAB;
  }

  // The post tab's ×: closing the tab you're on goes back to index.html, like :tabclose
  closePost() {
    const i = BUFFERS.findIndex((b) => b.post);
    if (i < 0) return;
    // Closed from the keyboard: keep focus in the tabline, on the tab now showing
    const focused = this.tablineEl.contains(document.activeElement);
    BUFFERS.splice(i, 1);
    if (this.active !== i) {
      if (this.active > i) this.active--;
      this.renderTabline();
    } else {
      this.active = 0;
      this.renderTabline();
      this.renderBuffer();
      this.syncRoute();
    }
    if (focused) this.tablineEl.querySelector(".tab.on").focus();
  }

  // The address is /posts/<slug> while a post is showing, and the page of posts
  // index.html is on otherwise (/ or /page/<n>). Every
  // change adds a history entry, so back always returns to the page you just left
  // (leaving a post for the list included). Back and forward themselves don't add
  // one: followRoute shows the page the address already points at.
  syncRoute() {
    const buf = BUFFERS[this.active];
    const want = buf.post ? "/posts/" + buf.post : pageHref(this.listPage);
    if (homePath(location.pathname) === want && !location.hash) return;
    try {
      history.pushState(null, "", want + location.search);
    } catch {
      // Opened from a file rather than a server: the site works, the address just doesn't change
    }
  }

  replaceUrl(path) {
    try {
      history.replaceState(null, "", path + location.search);
    } catch {
      /* see syncRoute */
    }
  }

  // Show whatever the address points at: a post, or a page of the post list
  followRoute() {
    const slug = routedPost();
    if (slug) {
      this.openPost(slug);
      return;
    }
    const page = routedPage();
    if (page !== this.listPage) {
      this.setListPage(page);
      if (this.active === 0) this.renderBuffer();
    }
    if (this.active !== 0) this.switchBuffer(0);
  }

  updateStatus() {
    // The mode block and the scroll-position block take the mode's color (see style.css)
    this.statusEl.dataset.mode = this.mode.toLowerCase();
    this.tablineEl.dataset.mode = this.mode.toLowerCase();
    this.modeEl.textContent = this.mode;
    const buf = BUFFERS[this.active];
    this.fileEl.textContent = buf.name;
    if (this.ftIconEl.dataset.icon !== buf.icon) {
      this.ftIconEl.innerHTML = faIcon(buf.icon);
      this.ftIconEl.dataset.icon = buf.icon;
    }
    this.ftLabelEl.textContent = buf.ft;
    const lh = parseFloat(getComputedStyle(this.contentEl).lineHeight) || 22.4;
    const lineNum = Math.max(1, Math.floor(this.contentEl.scrollTop / lh) + 1);
    this.posEl.textContent = lineNum + ",1";
    const scrollable = this.contentEl.scrollHeight - this.contentEl.clientHeight;
    let pct;
    if (scrollable <= 0) pct = "All";
    else if (this.contentEl.scrollTop / scrollable <= 0.001) pct = "Top";
    else if (this.contentEl.scrollTop / scrollable >= 0.999) pct = "Bot";
    else pct = Math.round((this.contentEl.scrollTop / scrollable) * 100) + "%";
    this.pctEl.textContent = pct;
  }

  resetKeys() {
    clearTimeout(this.keyTimer);
    this.keyState = "IDLE";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new VimSite();
});
