#!/usr/bin/env node
"use strict";

// Serves dist/ the way GitHub Pages does, so local addresses match production:
//
//   /                     dist/index.html
//   /posts/vim-statusline dist/posts/vim-statusline.html   (a file without its .html)
//   /posts/x.html         dist/posts/x.html                (the file itself works too)
//   /some-folder          redirects to /some-folder/, which serves its index.html
//   anything else         404, with dist/404.html
//
// Run: npm run preview    (builds first)    Port: PORT=3000 npm run preview, or --port 3000

const http = require("http");
const fs = require("fs");
const path = require("path");

const DIST = path.join(__dirname, "..", "dist");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

const isFile = (f) => fs.existsSync(f) && fs.statSync(f).isFile();
const isDir = (f) => fs.existsSync(f) && fs.statSync(f).isDirectory();

function createServer(dir = DIST) {
  const root = path.resolve(dir);
  const send = (res, status, file, method) => {
    res.writeHead(status, {
      "Content-Type": TYPES[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    if (method === "HEAD") res.end();
    else fs.createReadStream(file).pipe(res);
  };

  return http.createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    const target = path.join(root, pathname);
    const notFound = () => {
      const page = path.join(root, "404.html");
      if (isFile(page)) send(res, 404, page, req.method);
      else res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
    };
    // Nothing outside dist/
    if (target !== root && !target.startsWith(root + path.sep)) return notFound();

    if (pathname.endsWith("/")) {
      const index = path.join(target, "index.html");
      return isFile(index) ? send(res, 200, index, req.method) : notFound();
    }
    if (isFile(target)) return send(res, 200, target, req.method);
    if (isFile(target + ".html")) return send(res, 200, target + ".html", req.method);
    if (isDir(target) && isFile(path.join(target, "index.html"))) {
      res.writeHead(301, { Location: pathname + "/" }).end();
      return;
    }
    notFound();
  });
}

module.exports = { createServer, DIST };

if (require.main === module) {
  const flag = process.argv.indexOf("--port");
  const port = Number(flag > -1 ? process.argv[flag + 1] : process.env.PORT || 8080);
  if (!isDir(DIST)) {
    console.error("dist/ is missing. Run npm run build first (npm run preview does both).");
    process.exit(1);
  }
  createServer().listen(port, "127.0.0.1", () => {
    console.log(`Serving dist/ at http://localhost:${port}`);
  });
}
