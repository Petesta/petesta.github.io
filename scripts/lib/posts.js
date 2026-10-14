"use strict";

// Reads posts/*.md: front matter (between --- lines) and the markdown after it.
// Used by scripts/build.js and by the tests, so both see the same posts.

const fs = require("fs");
const path = require("path");
const YAML = require("yaml");

const POSTS_DIR = path.join(__dirname, "..", "..", "posts");
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/; // the file name, which becomes /posts/<slug>
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

function fail(file, message) {
  throw new Error(`${path.relative(process.cwd(), file)}: ${message}`);
}

/** One post: { slug, title, date, tags, excerpt, draft, markdown }. Throws on anything malformed. */
function readPost(file) {
  const slug = path.basename(file, ".md");
  if (!SLUG.test(slug))
    fail(
      file,
      `the file name becomes the address /posts/${slug}, so use lowercase letters, numbers and hyphens`,
    );

  const m = fs.readFileSync(file, "utf8").match(FRONT_MATTER);
  if (!m) fail(file, "start the file with front matter between two --- lines");
  let meta;
  try {
    meta = YAML.parse(m[1]) || {};
  } catch (e) {
    fail(file, `the front matter isn't valid YAML (${e.message.split("\n")[0]})`);
  }

  const date = String(meta.date ?? "");
  if (typeof meta.title !== "string" || !meta.title.trim()) fail(file, "title is missing");
  if (
    !DATE.test(date) ||
    Number.isNaN(Date.parse(date + "T00:00:00Z")) ||
    new Date(date + "T00:00:00Z").toISOString().slice(0, 10) !== date
  ) {
    fail(file, `date must be a real date written YYYY-MM-DD (got "${date}")`);
  }
  if (typeof meta.excerpt !== "string" || !meta.excerpt.trim())
    fail(
      file,
      "excerpt is missing (it is the preview on the home page and the description for search engines)",
    );
  const tags = meta.tags ?? [];
  if (!Array.isArray(tags) || tags.some((t) => typeof t !== "string" || !t.trim()))
    fail(file, "tags must be a list, like [css, vim]");
  if (meta.draft !== undefined && typeof meta.draft !== "boolean")
    fail(file, "draft must be true or false");

  return {
    slug,
    title: meta.title.trim(),
    date,
    tags,
    excerpt: meta.excerpt.trim(),
    draft: meta.draft === true,
    markdown: m[2],
  };
}

/** Every post, newest first. Drafts (draft: true) are left out unless `drafts` is set. */
function readPosts(dir = POSTS_DIR, { drafts = false } = {}) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => readPost(path.join(dir, f)))
    .filter((p) => drafts || !p.draft)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

module.exports = { POSTS_DIR, readPost, readPosts };
