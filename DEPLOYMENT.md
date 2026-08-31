# Riskyc Fashion — Operations Guide

Covers both repos (`riskyc-frontend`, `riskyc-backend`), the deploy script, and the
nginx reverse proxy on the VPS. Keep this file up to date if any of these paths,
commands, or the nginx config change.

## 1. Layout

| What | Where |
|---|---|
| Frontend repo (this one) | `github.com/Kams2004/riskyc-frontend` — local clone: `/home/kamsu-perold/Music/Riskyc-Fashion` |
| Backend repo | `github.com/Kams2004/riskyc-backend` — local clone: `/home/kamsu-perold/Music/Riskyc-Fashion/Riskyc` |
| Server | Contabo VPS, `167.86.120.214`, user `deploy`, hostname `vmi3081114` |
| Server: frontend clone | `~/riskyc/riskyc-frontend` |
| Server: backend clone | `~/riskyc/riskyc-backend` |
| Server: control script | `~/riskyc/riskyc.sh` (lives outside both repos — it manages both) |
| Domain | `riskycfashion.com` (OVH-registered, DNS → `167.86.120.214`) |
| Public URLs | `https://riskycfashion.com` (frontend), `https://api.riskycfashion.com` (backend), `https://media.riskycfashion.com` (MinIO) |

Both repos are on branch `main`. There is no staging branch — `main` is what
gets pulled on the server.

## 2. Git workflow (commit / push / pull)

Same pattern for **both** repos — just `cd` into the right one first.

### Commit + push (from your local machine)

```bash
# frontend
cd /home/kamsu-perold/Music/Riskyc-Fashion
git status                     # review what changed
git add <specific files>       # avoid `git add -A` blindly — check status first
git commit -m "Describe the change"
git push origin main

# backend
cd /home/kamsu-perold/Music/Riskyc-Fashion/Riskyc
git status
git add <specific files>
git commit -m "Describe the change"
git push origin main
```

Never commit `.env` — both repos gitignore it. If `git status` shows `.env` as
staged, unstage it (`git restore --staged .env`) before committing.

### Pull on the server (deploy the change)

```bash
ssh deploy@167.86.120.214

# frontend
cd ~/riskyc/riskyc-frontend
git pull

# backend
cd ~/riskyc/riskyc-backend
git pull
```

Pulling alone does **not** restart anything — the running containers keep
serving the old code until you restart (see §3).

## 3. Restarting — `riskyc.sh` reference

Run from `~/riskyc/` on the server:

```bash
cd ~/riskyc
./riskyc.sh <command> [service]
```

| Command | Effect |
|---|---|
| `./riskyc.sh start` | Start everything (postgres, minio, backend, frontend) |
| `./riskyc.sh start frontend` | Start only the frontend container |
| `./riskyc.sh start backend` | Start only the backend (+ its postgres/minio deps) |
| `./riskyc.sh stop` | Stop all containers, both stacks |
| `./riskyc.sh restart <service...>` | Plain restart of one or more running containers (e.g. `restart frontend`) — fast, but **reuses the existing image and does not re-read code changes** |
| `./riskyc.sh full-restart [frontend\|backend]` | Rebuilds the image from the latest pulled code and recreates the container(s). **This is what you need after `git pull` whenever source code changed** — omit the argument to full-restart both stacks |
| `./riskyc.sh status` | `docker ps` view of what's up |
| `./riskyc.sh logs` | Tail logs |
| `./riskyc.sh wipe-data` | Destroys postgres/minio volumes — confirmation-gated, only for a full reset |

### Which restart do I need?

- **Pulled new frontend or backend source code** → `full-restart frontend` or
  `full-restart backend` (rebuilds the image; a plain `restart` will silently
  keep serving the old build).
- **Only changed a runtime env var that isn't baked into the build** (e.g.
  `SITE_URL`, `FRONTEND_URL`, `MINIO_PUBLIC_URL`) → plain `restart <service>`
  is enough.
- **Changed a build-time env var** (`API_URL` for the frontend — it's baked
  into the client bundle via `NEXT_PUBLIC_API_BASE_URL` at build time) →
  needs `full-restart`, plain `restart` won't pick it up.
- **Frontend's `sitemap.xml` looks stale after a `SITE_URL` change** → the
  sitemap route caches for 1 hour on the container's filesystem
  (`export const revalidate = 3600` in `app/sitemap.ts`); a plain restart
  doesn't clear that cache, only `full-restart frontend` does.

Full end-to-end deploy of a code change, one repo:

```bash
ssh deploy@167.86.120.214
cd ~/riskyc/riskyc-frontend && git pull      # or riskyc-backend
cd ~/riskyc && ./riskyc.sh full-restart frontend   # or backend
./riskyc.sh status                            # confirm it's up
```

## 4. Nginx (reverse proxy + HTTPS)

### Accessing the config

```bash
ssh deploy@167.86.120.214
sudo nano /etc/nginx/sites-available/riskycfashion.com
```

(`vim` works too if you prefer it — same path.) It's enabled via a symlink in
`/etc/nginx/sites-enabled/`, standard Debian/Ubuntu nginx layout.

### Restarting nginx after an edit

Always test the config before reloading — a syntax error in a straight
`restart` will take the site down:

```bash
sudo nginx -t                    # must print "syntax is ok" / "test is successful"
sudo systemctl reload nginx      # applies the change without dropping connections
```

Use `sudo systemctl restart nginx` only if `reload` doesn't seem to pick up a
change (rare — needed for some binary/module-level settings, not for server
block edits).

### The config, as originally deployed

This is the reverse-proxy config that was written and applied via
`sites-available/riskycfashion.com`, **before** certbot ran. Name-based virtual
hosting on port 80: three domains, all pointing at `167.86.120.214`, routed by
the `Host` header to three different local ports — additive, doesn't touch
whatever else nginx already proxies on this box (e.g. other domains/apps on
the same VPS).

```nginx
# Frontend — riskycfashion.com and www.riskycfashion.com -> Next.js container on :3001
server {
    listen 80;
    server_name riskycfashion.com www.riskycfashion.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API — api.riskycfashion.com -> Spring Boot container on :8082
# Includes WebSocket upgrade headers (needed for the STOMP/chat + order-sync socket).
server {
    listen 80;
    server_name api.riskycfashion.com;

    location / {
        proxy_pass http://127.0.0.1:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Media — media.riskycfashion.com -> MinIO container on :9002
server {
    listen 80;
    server_name media.riskycfashion.com;

    location / {
        proxy_pass http://127.0.0.1:9002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### What's live now

After this was applied, `certbot --nginx` was run for all three subdomains,
which auto-provisioned Let's Encrypt certificates and **rewrote this file** —
it added matching `listen 443 ssl` blocks with `ssl_certificate`/
`ssl_certificate_key` directives per domain, plus `return 301 https://...`
redirect blocks for the old port-80 servers. That certbot-generated content is
**not reproduced above** because it wasn't authored here — certbot writes it
automatically and it includes machine-specific certificate paths.

**Before editing this file, always view the live version first** — it's the
source of truth, this doc's snippet above is only the pre-HTTPS baseline:

```bash
cat /etc/nginx/sites-available/riskycfashion.com
```

If you ever need to reissue or add a certificate for a new subdomain:

```bash
sudo certbot --nginx -d newsubdomain.riskycfashion.com
```

Certbot handles the nginx edit and reload itself in that case — no manual
`systemctl reload` needed afterward, but running `sudo nginx -t` afterward is
still a good sanity check.

## 5. Environment files quick reference

| File | Location | Notes |
|---|---|---|
| Frontend `.env` | `~/riskyc/riskyc-frontend/.env` on server | `API_URL` (build-time, needs `full-restart`), `FRONTEND_PORT`, `SITE_URL` (runtime, plain `restart` ok but sitemap cache needs `full-restart`), `GOOGLE_CLIENT_ID` (build-time — feeds `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, needs `full-restart`) |
| Backend `.env` | `~/riskyc/riskyc-backend/.env` on server | `FRONTEND_URL`, `MINIO_PUBLIC_URL`, `BACKEND_PORT`, `MINIO_API_PORT`, `MINIO_CONSOLE_PORT`, `POSTGRES_PASSWORD`, `MINIO_ROOT_USER`/`PASSWORD`, `JWT_SECRET`, `GOOGLE_CLIENT_ID` (runtime, plain `restart` ok — same value as the frontend's) |

Both `.env.example` files (in each repo root) document every variable inline
with both the raw-IP and the HTTPS-domain values — copy from there
(`cp .env.example .env`) rather than writing one from scratch.
