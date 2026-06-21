# ViewBot Architecture

Two-tier Node.js application: **server** (Express + Socket.IO + browser workers) and **SvelteKit frontend** served from `main/`. Root directory contains legacy scripts (extensions, headless launcher, cron workers).

```
├── extensions/          # Plugin extensions (NodeVM-sandboxed)
├── main/                # SvelteKit frontend + Express server entry
│   ├── src/             # SvelteKit routes, +server.ts API handlers
│   ├── server/          # Node.js server bootstrapping
│   │   ├── server.cjs           # Orchestrator: startFullServer, startWorking, proxy selection
│   │   ├── init_server.cjs      # Express middleware, Helmet, bearer token auth, route registration
│   │   ├── init_start.cjs       # DB setup, globals, Socket.IO, extension loading
│   │   ├── vars.cjs             # Settings defaults + role-based access control ranks
│   │   ├── generate_jobs.cjs    # Video→job pipeline: account actions, proxy assignment
│   │   ├── startWorker.cjs      # Browser worker: launch, ad skip, watch tracking, finish
│   │   ├── check_proxies.cjs    # Proxy validation: Mullvad audit, privacy test, Google GWS, YouTube connect
│   │   ├── fingerprint_generator.cjs # Browser fingerprint data (UA families, fonts, WebGL, screen)
│   │   └── json_db_fallback.cjs # JSON-file DB fallback when sqlite3 is unavailable
│   └── build/             # Compiled SvelteKit output (handler.js)
├── src/                   # Legacy root scripts (non-SvelteKit)
│   ├── index.js           # Main entry, worker launcher
│   └── headless_index.js  # Headless browser launcher
└── cache/raw_guests/    # Per-worker Chrome userDataDir (ephemeral)
```

---

## 1. Configuration & Settings (`vars.cjs`)

Single source of truth for all runtime defaults. Two exports:
- `neededRanks`: role hierarchy (0=public → 4=admin) gating API endpoints.
- `defaultServerInfo`: 30+ settings covering proxy protocol, concurrency, viewport, user-agent families, ad-skipping, timeout, AV1, mouse behavior.

**YAGNI candidates**: unused ranks (`add_job`, `remove_job`, `edit_job` marked `** NOT IMPLEMENTED **`), many settings with empty defaults (`user_agents_categories`, `user_agents_selected`, `webgl_vendor`, `webgl_renderer`).

---

## 2. Database Layer (`init_start.cjs`, `json_db_fallback.cjs`)

Tries sqlite3 first, falls back to JSON file store. Wraps raw sqlite3 into promise-based helpers (`dbRun`, `dbGet`, `dbAll`, `dbGetValues`, `dbRunWithValues`).

Tables: `bandwidth`, `views`, `watch_time`, `video_cache`, `options`, `cache`, `secret`, `videos`, `good_proxies`, `proxies`, `srv_password`, `keys`, `premium_cache`, `free_cache`.

**YAGNI candidates**: `premium_cache`/`free_cache` tables (patreon gating), `video_cache` (unused in current flow), `cache` URL cache, `keys` API key table (legacy). JSON fallback is ~137 lines of regex-based SQL translation — fragile but functional for dev.

---

## 3. Server Bootstrap (`init_server.cjs`, `server.cjs`)

**`init_server.cjs`**: Express middleware pipeline — Helmet, session (SQLite store), bearer token auth, JSON body parser. Two middleware functions (`verifyToken`, `verifyLoginStatus`) gate API access. Socket.IO session attachment.

**`server.cjs`**: Main orchestrator. Loads API routes from `api_routes/` directory. Defines global routes (`route.get`, `route.post`) and Socket.IO `socket.use` middleware. Contains:
- `selectProxyForJob()`: Round-robin proxy selection with 15-minute cooldown per video.
- `startWorking()`: State machine (0=idle, 1=testing, 2=running) managing worker lifecycle.
- Worker spawning with concurrency control, overload detection (CPU/RAM), and interleave job scheduling.
- SIGINT handler killing all children and closing DB.

**YAGNI candidates**: `urlTesterInstance` from `fast-proxy-tester` instantiated empty on startup but only used for initial proxy format check. The actual proxy validation in `check_proxies.cjs` does all real work. `proxyUsageHistory` global tracking could be per-job state.

---

## 4. Proxy Validation (`check_proxies.cjs`)

Multi-stage proxy checker, runs concurrently (limit 50):
1. Format validation via `fast-proxy-tester`.
2. Mullvad exit-node / ASN blacklist audit.
3. Privacy test (elite vs transparent).
4. Google GWS pre-flight (200 OK, no CAPTCHA "sorry" redirect, GWS server header).
5. YouTube connectivity test.
6. Bandwidth test (commented-out ytdl download, replaced with timeout-only check).

Results categorized: `good`, `bad`, `untested`. Bad proxies get 3×timeout hard deadline.

**YAGNI candidates**: Stage 5 (ytdl bandwidth test) is commented out — dead code. Hardcoded bad orgs list is unmaintainable. `localIP` pre-flight could be cached across runs.

---

## 5. Job Generation (`generate_jobs.cjs`)

Translates video config into concrete viewing jobs. Uses `youtube-selfbot-api` for YouTube, `rumble-core`/`rumble-selfbot-api` for Rumble.

Flow:
1. Fetch video info via selfbot API (YouTube or Rumble).
2. For each guest view: generate a guest job.
3. For each account: generate an account job with actions (like, dislike, subscribe, comment) determined by `calculateAction()` probability functions.
4. Set watch time based on video type (livestream vs regular), ensure minimum watch before first action.
5. Shuffle jobs array.

**YAGNI candidates**: `rumble_core` and `rumble_selfbot_api` imported but may be unused (Rumble support is minimal in this fork). `calculateAction()` has complex probability logic for single action; rarely needs all three (like+dislike+subscribe). `work_video.referrals` and `work_video.keywords` sources unclear.

---

## 6. Browser Worker (`startWorker.cjs`)

Core browser automation engine. Each worker:
1. Creates ephemeral `userDataDir` in `cache/raw_guests/`.
2. Launches browser via `youtube-selfbot-api` or `rumble-selfbot-api`.
3. Injects sticky session into proxy URL if enabled.
4. Opens page, pre-flights Google referer, navigates to video.
5. Creates `workerHolder` with stuck timer, kill/finish/fail lifecycle.
6. Enters 500ms heartbeat loop: ad detection/skip, watch time tracking, action triggers (likeAt/dislikeAt/subscribeAt/commentAt), finish on completion or timeout.

Supports YouTube and Rumble via separate `startYouTubeWorker`/`startRumbleWorker` functions.

**YAGNI candidates**: Duplicate pre-flight GWS logic in both YouTube and Rumble workers. `wtfp` (watch time floor percentage) calculation `(duration / 100) * watch_time` is obscure. `workingList` global is mutated by setInterval — no cleanup on worker finish in all paths. `removeUserDataDir` retries 5× with exponential backoff but is called after browser close (which may already hold handles).

---

## 7. Fingerprint Generation (`fingerprint_generator.cjs`)

Static fingerprint profiles for 4 browser families (Windows Chrome 40%, macOS Safari 25%, Linux Firefox 15%, Windows Edge 20%). Each defines:
- UA templates, version ranges, tags, platform, vendor.
- Font lists (100+ fonts per platform).
- Screen resolutions, hardware concurrency, device memory, DPR values.
- Plugin/mimeType definitions.
- Chrome features (WebHID, Serial, WebNFC, etc.) with random boolean gates.

**YAGNI candidates**: 756 lines generating fingerprints that are passed to the selfbot API — much of this duplication exists in `youtube-selfbot-api` already. Font lists are massive but only ~10 are typical per OS. `genChromeFeatures()` generates 40+ boolean flags with random gates — many are irrelevant to video watching.

---

## 8. Extensions (`extensions/`)

NodeVM-sandboxed plugins loaded at startup. Each extension has `info.json` + `main.js`. Sandboxed API: `getWorkingStatus()`, `getProxies()`, `getVideos()`, `transformProxies()`, `transformStatus()`, `computeTime()`, `getCurrentTime()`.

Current extensions: `0/main.js` (7 lines), `1/main.js` (empty).

---

## 9. SvelteKit Frontend (`main/`)

SvelteKit app serving the admin UI. `+server.ts` handlers expose API endpoints. `src/background.ts` manages settings sync — polls `/api/settings`, pushes changes every 100ms, subscribes to Socket.IO `settings` events.

---

## Data Flow Summary

```
Settings → vars.cjs
    ↓
DB (sqlite3/json) stores: videos, proxies, good_proxies, options, keys, stats
    ↓
User adds videos/proxies → POST /api/videos, POST /api/proxies
    ↓
"Start" → startWorking(1) → check_proxies() → startWorking(2)
    ↓
generateJobs() → jobs[] (interleaved)
    ↓
startWorker() → browser launch → workerHolder heartbeat → like/dislike/subscribe/comment
    ↓
Stats updated: views, watch_time, bandwidth → GET /api/stats → UI renders
```

## Key Dependencies

- `express`, `socket.io`, `express-session`, `connect-sqlite3` — web framework
- `youtube-selfbot-api` — YouTube browser automation
- `rumble-selfbot-api`, `rumble-core` — Rumble support
- `fast-proxy-tester` — proxy format validation
- `proxy-agent-v2`, `axios` — HTTP proxy support
- `helmet`, `express-bearer-token` — security/auth
- `await-to-js`, `uuid`, `vm2` — utilities
