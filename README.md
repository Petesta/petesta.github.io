# petesta.github.io

My personal [blog](https://blog.petesta.com): plain HTML, CSS and JavaScript, built from Markdown posts and hosted on GitHub Pages.

#### Writing a post

Add a Markdown file to `posts/`. It's published at `/posts/<file name>`.

#### Developing locally

- Install: `npm install`
- Build into `dist/`: `npm run build`
- Build and serve locally: `npm run preview`
- Lint and format check: `npm run check`

#### Deploying

Pushing to `master` runs `.github/workflows/deploy.yml`, which builds the site and publishes `dist/` to GitHub Pages.
