# Docker build and runtime env injection

## Why this is needed

Next.js **inlines** `process.env.NEXT_PUBLIC_*` (and other env vars it reads) at **build time**. When you build the image, you often don’t have real values (e.g. they come from AWS Secrets at deploy time). If you build without them, the app is stuck with `undefined` or whatever was in the build environment.

This setup lets you:

1. **Build** the image with **placeholder** values (so the bundle is valid).
2. **At container start**, when real env vars are available (e.g. from AWS), **replace** those placeholders in the built files, then start the server.

So the app effectively gets runtime env (e.g. from AWS) even though Next.js only bakes in values at build time.

---

## What each piece does

### 1. `.env.example`

Lists env vars that must be available at **runtime** and are inlined at build time (typically `NEXT_PUBLIC_*`). Example values are only for documentation; they are not used as‑is in production.

### 2. `scripts/set_dummy_env.js` (build time, in Dockerfile)

- Runs **during `docker build`**, before `npm run build`.
- Reads `.env.example` and builds a **`.env`** where each variable is set to a **placeholder**: the **MD5 hash of the variable name** (e.g. `NEXT_PUBLIC_API_BASE_URL` → `a1b2c3d4e5...`).
- Next.js then runs `next build` with this `.env`, so the built JS in `.next/` contains those **hash strings** instead of real secrets or URLs.

So: **build time** = inject placeholders so the build succeeds and the bundle has fixed, known strings we can find later.

### 3. `scripts/search_and_replace_env.js` (runtime, when container starts)

- Runs **when the container starts** (in `build_and_run.sh`), when real env vars are already set (e.g. by AWS Secrets Manager, ECS task definition, etc.).
- Reads `.env.example` again to know **which keys** to consider.
- For each key, computes **MD5(key)** (same as build) and gets **`process.env[key]`** (the real value).
- Scans all **`.next/**/*.js`** files and **replaces** every occurrence of the placeholder string with the real value.
- After that, `node server.js` runs, so the app sees the real API URL, etc.

So: **runtime** = replace placeholders in the built files with actual env, then start the app.

### 4. `scripts/build_and_run.sh`

- Sets `NODE_ENV=production`, `NEXT_TELEMETRY_DISABLED=1`.
- Runs `node scripts/search_and_replace_env.js` to do the replacement.
- Starts the app with `exec node server.js` (Next.js standalone server).

### 5. Dockerfile

- **deps**: installs `node_modules` with `npm ci`.
- **builder**: copies source, runs `set_dummy_env.js` (create `.env` with placeholders), then `npm run build`. Produces `.next/standalone` and `.next/static`.
- **runner**: copies only standalone output + `public` + `.env.example` + `build_and_run.sh` and `search_and_replace_env.js`. No `node_modules` or source. Entrypoint is `build_and_run.sh`, which does the runtime replace then starts the server.

---

## Flow summary

| Phase    | Where     | What happens |
|----------|-----------|------------------------------------------------------------------|
| Build    | Dockerfile| `set_dummy_env.js` → `.env` with `KEY=md5(KEY)`. `next build` inlines those hashes into `.next/`. |
| Runtime  | Container | Env vars set (e.g. AWS). `search_and_replace_env.js` replaces each `md5(KEY)` in `.next/**/*.js` with `process.env[KEY]`. Then `node server.js`. |

---

## Usage

**Build:**

```bash
docker build -t itamba-signup-flow .
```

**Run (pass real env at start):**

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_BASE_URL=https://api.prod.example.com \
  -e NEXT_PUBLIC_AUTH_REFRESH_PATH=/api/auth/refresh \
  itamba-signup-flow
```

On AWS, set `NEXT_PUBLIC_API_BASE_URL` (and any other vars from `.env.example`) in the task definition or via Secrets Manager; the container will inject them when it starts.

---

## Adding a new inlined env var

1. Add it to **`.env.example`** (with a dummy value).
2. Rebuild the image. No change needed in the scripts; they use the keys from `.env.example` for both build (placeholders) and runtime (replace with `process.env`).
