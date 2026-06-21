# ViewBot YAGNI Simplification Plan

> For Hermes: Execute tasks sequentially. Commit after each. Keep diffs small.

**Goal:** Remove dead code, duplicate logic, and unnecessary complexity from ViewBot server modules.

**Architecture:** One pass per file. Each task = one clear reduction. Verify syntax after each commit.

---

## Task 1: Deduplicate convertProxyFormat

**Objective:** Remove the duplicate `convertProxyFormat` from `startWorker.cjs` (L38-56), since `check_proxies.cjs` already has the same function (L18-36).

**Files:**
- Modify: `main/server/startWorker.cjs:L38-56`

**Steps:**
1. Delete lines 38-56 from `startWorker.cjs` (the `convertProxyFormat` function)
2. Ensure `startWorker.cjs` uses `convertProxyFormat` from the same scope (it's defined earlier in the file at L38, but `check_proxies.cjs` has its own copy at L18 — both are identical)

**Wait** — actually both files define it independently. Pick one file as canonical (`check_proxies.cjs` since it's the "source" of proxy logic) and re-export from a shared util, OR inline it where needed.

**Decision:** Keep it in `check_proxies.cjs` only. In `startWorker.cjs`, inline the conversion at L61 (`injectStickySession`) — it's only called once there.

**Step 1:** In `startWorker.cjs` L61, replace `convertProxyFormat(proxyUrl)` with inline:
```js
let converted = proxyUrl;
if (proxyUrl.includes("://")) {
    let pp = proxyUrl.split("://");
    if (pp[0] === "socks5h") pp[0] = "socks5";
    if (pp[0] === "socks4h") pp[0] = "socks4";
    converted = pp[0] + "://" + pp.slice(1).join(":");
}
```

**Step 2:** Delete lines 38-56 from `startWorker.cjs`.

**Step 3:** Verify syntax: `node -c main/server/startWorker.cjs`

**Step 4:** Commit:
```bash
git add main/server/startWorker.cjs
git commit -m "refactor: inline convertProxyFormat in startWorker.cjs, remove duplicate"
```

---

## Task 2: Remove dead verifyLoginStatus in init_server.cjs

**Objective:** `verifyLoginStatus` (L55-58) always sets `req.session.loggedIn = true` and calls `next()`. It's a no-op middleware.

**Files:**
- Modify: `main/server/init_server.cjs:L55-58`

**Steps:**
1. Delete `verifyLoginStatus` function and its usage at L22
2. Verify: `node -c main/server/init_server.cjs`
3. Commit: `git commit -m "delete: remove dead verifyLoginStatus middleware (always passes)"`

---

## Task 3: Remove unused MessageUser from init_start.cjs

**Objective:** `MessageUser` (L103-115) is defined but never called — only `RemindUser` is used (via the setInterval on L146). The `decisionTaken` promise it references is never resolved.

**Files:**
- Modify: `main/server/init_start.cjs:L103-115`

**Steps:**
1. Delete `MessageUser` function (L103-115)
2. Verify: `node -c main/server/init_start.cjs`
3. Commit: `git commit -m "delete: remove dead MessageUser function (never called)"`

---

## Task 4: Simplify logging helpers in init_start.cjs

**Objective:** `computeStringDate` (L53-57) and `computeAccureteTime` (L59-63) are only used by `MakeLog` (L88-101). Inline them.

**Files:**
- Modify: `main/server/init_start.cjs:L53-63`

**Steps:**
1. Inline `computeStringDate` into `MakeLog` L89
2. Inline `computeAccureteTime` into `MakeLog` L91
3. Delete both functions
4. Verify: `node -c main/server/init_start.cjs`
5. Commit: `git commit -m "shrink: inline computeStringDate and computeAccureteTime into MakeLog"`

---

## Task 5: Remove computeAccureteTime/computeStringDate/getCurrentTime/ComputeTime unused functions

**Objective:** Check if `computeTime` is used. It's exported at L373 in `makeGlobal`. Check callers.

**Files:**
- Check: `main/server/init_start.cjs` usage of each function

**Steps:**
1. Search for `computeTime(` usage across the codebase — if only used internally, inline it too
2. Same for `getCurrentTime` — if only L66 calls `computeTime`, and nothing else calls `getCurrentTime`, merge them
3. Verify and commit

---

## Task 6: Simplify json_db_fallback.cjs

**Objective:** 137 lines for a JSON fallback DB that only handles ~15 SQL patterns. The `prepare().run()` switch statement (L39-86) is a big switch with regex matching.

**Decision:** Keep it as-is for now — it works. Mark as "defer" for later.

**Skip for now.** Mark file for later audit.

---

## Task 7: Remove deepCopy/deepEqual from background.ts

**Objective:** `deepCopy` (L53-55) uses `JSON.parse(JSON.stringify())`. `deepEqual` (L57-63) is a recursive object comparator. Modern JS has `structuredClone()`.

**Completed:** Replaced with `structuredClone`. Commit already made.

---

## Task 8: Audit fingerprint_generator.cjs

**Objective:** 756 lines, mostly static data. Identify what can be moved to JSON or removed.

**Decision:** Move font lists and feature flags to separate JSON data files. Schedule as a separate task.

**Sub-task 8a:** Extract `genChromeFeatures`, `genSafariFeatures`, `genFirefoxFeatures` into a `features.json` data file.
**Sub-task 8b:** Move font arrays to `fonts.json`.

---

## Task 9: Remove unused rumble_core import in generate_jobs.cjs

**Decision:** Keep for now — both `rumble_core` and `rumble_selfbot_api` are used in the Rumble code path.

---

## Task 10: Audit startWorker.cjs ad logic

**Finding:** `settings.watch_ads` (L111 in startWorker.cjs) is NEVER defined in vars or background. The `if (settings.watch_ads)` branch at L111 is effectively dead code.

**Steps:**
1. Remove the dead `if (settings.watch_ads)` branch (L111-129), keep only the else body
2. Verify: `node -c main/server/startWorker.cjs`
3. Commit: `git commit -m "delete: remove dead settings.watch_ads branch (never defined)"`

---

## Task 11: Clean up init_start.cjs — remove unused random() function

**Decision:** Keep it — used globally via `global.makeGlobal`.

---

## Task 12: Verify console.log monkey-patch usage

**Decision:** Keep — it's the only way log files get written.

---

## Task 13: Check for duplicate clamp function

**Finding:** `init_start.cjs` has `random()` at L37-47. `startWorker.cjs` has `clamp()` at L34-36. Different functions.

**Skip.**

---

## Task 14: Remove verifyLoginStatus from init_server.cjs (duplicate confirmation)

Already in Task 2.

---

## Task 15: Setup Jest + ts-jest config for ViewBot project

**Objective:** Create test infrastructure with Jest, ts-jest, and proper config for the ViewBot monorepo structure (both CJS server and TypeScript extension).

**Files to create:**
- `main/server/jest.config.js` — Jest config for server (CJS, Node.js environment, `transform` for .cjs files)
- `main/src/jest.config.js` — Jest config for extension (TS, browser-like environment)
- `main/server/tsconfig.test.json` — TS config for test compilation
- `main/src/tsconfig.test.json` — TS config for test compilation
- Root `package.json` update: add `"test": "jest"` script and jest/ts-jest dev dependencies

**Steps:**
1. `npm install --save-dev jest ts-jest @types/jest ts-node typescript` in ViewBot root
2. Create `jest.config.js` at root level (monorepo-style):
```js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.{js,ts,cjs}'],
  moduleFileExtensions: ['js', 'ts', 'cjs', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.cjs$': 'ts-jest'
  },
  moduleNameMapper: {
    '^rumble-core$': '<rootDir>/../node_modules/rumble-core',
    '^youtube-selfbot-api$': '<rootDir>/../node_modules/youtube-selfbot-api'
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'main/server/**/*.cjs',
    'main/src/**/*.ts'
  ],
  testTimeout: 15000
};
```
3. Create `tsconfig.test.json`:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "esModuleInterop": true,
    "module": "CommonJS",
    "types": ["jest", "node"]
  },
  "include": ["main/server/**/*.ts", "main/src/**/*.ts", "tests/**/*.ts"]
}
```
4. Update `package.json` with test script
5. Verify: `npx jest --version`
6. Commit

---

## Task 16: Write unit tests for ViewBot

**Objective:** Create comprehensive test suite to ensure app works as well as before simplification changes.

### Unit Tests (pure functions, no server/DOM):

**convertProxyFormat tests** (`main/server/tests/check_proxies.test.cjs`):
- `convertProxyFormat('user:pass@host:port')` → `'http://user:pass@host:port'`
- `convertProxyFormat('user:pass@host:port:3128')` → `'http://user:pass@host:port:3128'` (4 parts → username:password@host:port)
- `convertProxyFormat('socks5h://user:pass@host:port')` → `'socks5://user:pass@host:port'`
- `convertProxyFormat('socks4h://host:port')` → `'socks4://host:port'`
- `convertProxyFormat('http://host:port')` → `'http://host:port'`
- `convertProxyFormat('host:port')` → `'http://host:port'` (default protocol)
- `convertProxyFormat(null/undefined)` → returns as-is

**random() tests** (`main/server/tests/init_start.test.cjs`):
- `random(min, max)` returns integer in `[min, max)`
- `random(array)` returns element from array
- `random(100)` returns integer in `[0, 100)`

**clamp() tests** (`main/server/tests/util.test.cjs`):
- `clamp(5, 0, 10)` → `5`
- `clamp(-1, 0, 10)` → `0`
- `clamp(15, 0, 10)` → `10`
- `clamp(0, 0, 10)` → `0`
- `clamp(10, 0, 10)` → `10`
- `clamp(5, 5, 5)` → `5` (equal bounds)

**calculateAction() tests** (`main/server/tests/generate_jobs.test.cjs`):
- `calculateAction({likePercent:100, dislikePercent:0, subscribePercent:0})` → `['like', 'subscribe' or 'none']`
- `calculateAction({likePercent:0, dislikePercent:100, subscribePercent:0})` → `['dislike', 'none']`
- `calculateAction({likePercent:0, dislikePercent:0, subscribePercent:100})` → `['like' or 'none', 'subscribe']`
- `calculateAction({likePercent:0, dislikePercent:0, subscribePercent:0})` → `['none']`
- `calculateAction({likePercent:50, dislikePercent:50, subscribePercent:50})` → valid action array

**generateJob() tests** (`main/server/tests/generate_jobs.test.cjs`):
- With account: job has `account` with like/dislike/subscribe/comment flags, actionAt timestamps
- Without account: job has no `account` field, `accountOnlyTypes` filtered from watch_types
- Filter parsing: `duration: '5 minutes'` → `filters.duration: '5'`
- Filter parsing: `sort_by: 'view count'` → `filters.sort_by: 'view_count'`
- Livestream: sets `watch_time` from `livestream_watchtime`, `isLivestream: true`
- Video: sets `watch_time` from `watch_time` array via `random(min, max)`
- Watch time adjustments: `likeAt + 10` etc. push `watch_time` up if needed
- Referer: picks from `work_video.referrals`
- Keyword: picks from `[...keywords, title]`
- Proxy: picks from `work_proxies`
- `generateJob` pushes to `global.jobs` array

**json_db_fallback.cjs tests** (`main/server/tests/json_db_fallback.test.cjs`):
- `loadDB()` returns correct default structure when file doesn't exist
- `loadDB()` parses valid JSON file
- `saveDB()` writes valid JSON
- `createFallbackDB().prepare().run()` handles all SQL patterns (INSERT/UPDATE for proxies, good_proxies, videos, options, watch_time, views, bandwidth)
- `createFallbackDB().prepare().get()` handles all SELECT patterns
- `createFallbackDB().prepare().all()` handles all SELECT * patterns
- Session store: set/get/destroy operations

**fingerprint_generator.cjs tests** (`main/server/tests/fingerprint_generator.test.cjs`):
- `generateProfile()` returns valid fingerprint object with all required fields
- `generateBatch(n)` returns n fingerprints
- `pickWeightedFamily()` respects family weights (40% windowsChrome)
- Generated UA strings match browser patterns
- `generateHeaders()` produces valid header arrays for each family
- `generatePluginsForFamily()` returns correct plugin arrays
- `generateMimesForFamily()` returns correct MIME type arrays
- Fingerprint JSON is parseable and complete

**background.ts structuredClone tests** (`main/src/tests/background.test.ts`):
- `structuredClone()` correctly clones nested objects/arrays
- `structuredClone()` handles circular refs via DOMException
- `publishData()` cycle: data → publish → receive → clone → verify matches original

### Integration Tests:

**verifyToken middleware** (`main/server/tests/verifyToken.test.cjs`):
- Valid token with status >= required → `req.goodToken = true`, calls `next()`
- Valid token with status < required → `res.sendStatus(403)`
- No token, statusRequired > 1 → `res.sendStatus(403)`
- No token, statusRequired <= 1 → calls `next()` (public path)
- Unknown subpath with lastRoute='api' → `res.sendStatus(404)`

**neededRanks hierarchy** (`main/server/tests/neededRanks.test.cjs`):
- Verify `login: 0` (public)
- Verify `health, workingStatus, latest_version, version, proxiesStats, video_details, view_stats, video_info, view_workers_stats, view_extensions, patreon_status, free_status: 1`
- Verify `videos, proxies, settings: 2`
- Verify `add_job, remove_job, edit_job: 3`
- Verify `change_settings, change_password: 4`

**DB operations** (`main/server/tests/db.test.cjs`):
- `dbRun()` executes INSERT/UPDATE/DELETE
- `dbRunWithValues()` executes parameterized queries
- `dbGet()` executes single row SELECT
- `dbGetAll()` executes multi-row SELECT
- `dbGetValues()` executes single row SELECT with values
- SQLite3 fallback: all operations work with fallback DB

**API route responses** (`main/server/tests/api_routes.test.cjs`):
- Each `GET /api/get/*` route returns correct JSON structure
- Each `POST /api/post/*` route returns correct response
- `GET /api/get/health` returns system info fields
- `GET /api/get/settings` returns current settings
- `GET /api/get/proxies` returns proxy list
- `GET /api/get/videos` returns video list
- `POST /api/post/login` handles login flow
- `POST /api/post/change_password` handles password change

**Socket.IO events** (`main/server/tests/socket.test.cjs`):
- Socket joins room on connect
- `io.emit('newProxiesStats')` broadcasts to all clients
- `io.emit('health')` broadcasts health data
- Socket event handlers: decisionTaken, log_message, videos, proxies, accounts_import, comments_import

**startWorker.cjs tests** (`main/server/tests/startWorker.test.cjs`):
- `injectStickySession()` adds session ID to proxy URL when enabled
- `injectStickySession()` returns proxy URL as-is when disabled or direct
- `removeUserDataDir()` retries on EBUSY/EPERM
- `removeUserDataDir()` succeeds on first try if no error
- `removeUserDataDir()` returns after max retries

**login endpoint** (`main/server/tests/login.test.cjs`):
- Creates user key with hashed password
- Returns token on success
- Returns error on duplicate username
- Password stored correctly

**change_password endpoint** (`main/server/tests/changePassword.test.cjs`):
- Updates password hash for existing key
- Returns success/error correctly

---

## Summary of Tasks by Priority

|| # | File | Cut | Lines Saved |
||---|------|-----|-------------|
|| 1 | startWorker.cjs | Inline convertProxyFormat, remove duplicate | ~20 |
|| 2 | init_server.cjs | Remove dead verifyLoginStatus | ~6 |
|| 3 | init_start.cjs | Remove dead MessageUser | ~13 |
|| 4 | init_start.cjs | Inline computeStringDate/Time | ~15 |
|| 7 | background.ts | structuredClone instead of deepCopy | ~10 |
|| 10 | startWorker.cjs | Remove dead watch_ads branch | ~19 |
|| 8a | fingerprint_generator.cjs | Extract feature flags to JSON | ~100 (deferred) |

**Total immediate savings: ~83 lines of dead/unnecessary code.**

---

## Test Coverage Goals

After all tests are written and passing:
- Unit tests for ALL pure functions (convertProxyFormat, clamp, random, calculateAction, generateJob)
- Integration tests for ALL middleware (verifyToken, helmet, session, bearerToken)
- Integration tests for ALL API routes (health, version, settings, proxies, videos, login, change_password)
- Integration tests for ALL DB operations (sqlite3 + fallback)
- Integration tests for ALL socket events
- Integration tests for worker lifecycle (injectStickySession, removeUserDataDir)
- **Passing before changes → Passing after changes = no regression**
