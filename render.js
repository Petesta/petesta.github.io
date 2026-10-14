"use strict";

// ── Shared rendering ───────────────────────────────────────────────────────
// Used in the browser by main.js, and by scripts/build.js to write the same HTML
// into each page ahead of time. Keeping one copy means a page the build wrote and
// the same page drawn by main.js are identical, so nothing jumps when main.js takes over.

(function (root) {
  const SITE_NAME = "Pete Cruz";
  const HOME_TITLE = SITE_NAME + " · Software Engineer";
  const titled = (page) => page + " · " + SITE_NAME;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const postHref = (p) => "/posts/" + p.slug;

  // Dates are YYYY-MM-DD; format them in UTC so they never shift a day
  function formatDate(iso) {
    return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  function readTime(p) {
    const words = p.body
      .replace(/<[^>]+>/g, " ")
      .split(/\s+/)
      .filter(Boolean).length;
    return Math.max(1, Math.round(words / 200)) + " min read";
  }

  // main.js searches for a tag when it's clicked (design tag-click-variants.html, option 2)
  const postTags = (p) =>
    p.tags
      .map((t) => '<span data-tag="' + escapeHtml(t) + '">#' + escapeHtml(t) + "</span>")
      .join("");

  // Home page list (design 4d): a thin frame per post with the date set into its top border
  function renderPosts(posts) {
    return (
      '<section class="posts" aria-label="Blog posts">' +
      posts
        .map(
          (p) =>
            '<a class="post-card" href="' +
            postHref(p) +
            '" data-slug="' +
            p.slug +
            '">' +
            '<time class="post-date" datetime="' +
            p.date +
            '">' +
            formatDate(p.date) +
            "</time>" +
            '<h2 class="post-title">' +
            escapeHtml(p.title) +
            "</h2>" +
            '<p class="post-excerpt">' +
            escapeHtml(p.excerpt) +
            "</p>" +
            '<div class="post-tags">' +
            postTags(p) +
            "</div>" +
            "</a>",
        )
        .join("") +
      "</section>"
    );
  }

  // ── Pages of posts ───────────────────────────────────────────────────────
  // The list is split into pages of PER_PAGE, newest first: page 1 is / and the
  // rest are /page/2, /page/3, ... There is no /page/1.
  const PER_PAGE = 5;
  const pageCount = (n) => Math.max(1, Math.ceil(n / PER_PAGE));
  const pagePosts = (posts, page) => posts.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pageHref = (page) => (page === 1 ? "/" : "/page/" + page);
  const pageName = (page) => (page === 1 ? "index.html" : "Page " + page);
  const pageTitle = (page) => (page === 1 ? HOME_TITLE : titled(pageName(page)));

  // Newer on the left, where you are in the middle, older on the right (design A2). Both
  // sides are always there: one with nowhere to go is greyed out, with a dash under its
  // label, and isn't a link. `link` is the link's attributes and text, or null. The
  // sides are classed <side>-newer and <side>-older.
  function navPair(tag, cls, side, label, newer, position, older) {
    const one = (kind, arrow, link) =>
      link
        ? '<a class="' +
          side +
          "-" +
          kind +
          '" href="' +
          link.href +
          '"' +
          link.attrs +
          '><span class="lbl">' +
          arrow +
          '</span><span class="t">' +
          escapeHtml(link.text) +
          "</span></a>"
        : '<span class="' +
          side +
          "-" +
          kind +
          ' is-off" aria-disabled="true"><span class="lbl">' +
          arrow +
          '</span><span class="t">—</span></span>';
    return (
      "<" +
      tag +
      ' class="' +
      cls +
      ' nav-pair" aria-label="' +
      label +
      '">' +
      one("newer", "← Newer", newer) +
      '<span class="nav-pos">' +
      position +
      "</span>" +
      one("older", "Older →", older) +
      "</" +
      tag +
      ">"
    );
  }

  function renderPager(page, pages) {
    const link = (p) =>
      p >= 1 && p <= pages
        ? { href: pageHref(p), attrs: ' data-page="' + p + '"', text: pageName(p) }
        : null;
    return navPair(
      "nav",
      "pager",
      "pager",
      "Pages",
      link(page - 1),
      page + " / " + pages,
      link(page + 1),
    );
  }

  // One page of the home list: its posts and the pager under them
  function renderList(posts, page) {
    return (
      '<div class="post-list">' +
      renderPosts(pagePosts(posts, page)) +
      renderPager(page, pageCount(posts.length)) +
      "</div>"
    );
  }

  // Post buffer (design 5): the date and hashtags set into the header frame's top and
  // bottom borders. It's HTML rather than buffer lines, so it has no tilde column.
  // `posts` is the full list, newest first, for the links to the posts on either side.
  // The footer matches the list pages' pager, with this post's place in the middle.
  function renderPost(p, posts) {
    const i = posts.indexOf(p);
    // The title is cut to one line in the footer, so the whole title is its tooltip
    const link = (q) =>
      q
        ? {
            href: postHref(q),
            attrs: ' data-slug="' + q.slug + '" title="' + escapeHtml(q.title) + '"',
            text: q.title,
          }
        : null;
    return (
      '<article class="post-view" aria-labelledby="post-title">' +
      '<header class="post-head">' +
      '<time class="post-date" datetime="' +
      p.date +
      '">' +
      formatDate(p.date) +
      "</time>" +
      '<h1 id="post-title">' +
      escapeHtml(p.title) +
      "</h1>" +
      '<div class="post-meta">' +
      readTime(p) +
      "</div>" +
      '<div class="post-tags">' +
      postTags(p) +
      "</div>" +
      "</header>" +
      '<div class="prose">' +
      p.body +
      "</div>" +
      navPair(
        "footer",
        "post-foot",
        "post",
        "More posts",
        link(posts[i - 1]),
        i + 1 + " / " + posts.length,
        link(posts[i + 1]),
      ) +
      "</article>"
    );
  }

  const api = {
    SITE_NAME,
    HOME_TITLE,
    titled,
    escapeHtml,
    postHref,
    formatDate,
    readTime,
    renderPosts,
    renderPost,
    PER_PAGE,
    pageCount,
    pagePosts,
    pageHref,
    pageName,
    pageTitle,
    renderPager,
    renderList,
  };
  if (typeof module === "object" && module.exports) module.exports = api;
  else Object.assign(root, api);
})(globalThis);
