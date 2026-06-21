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
1. Inline `computeStringDate` into `MakeLog` L89:
```js
let date = new Date();
date = `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`;
```
2. Inline `computeAccureteTime` into `MakeLog` L91:
```js
let t = new Date();
let currentTime = `${t.getDate()}-${t.getMonth()}-${t.getFullYear()} ${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}.${t.getMilliseconds()}`;
```
3. Delete `computeStringDate` (L53-57) and `computeAccureteTime` (L59-63) functions
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

**Files:**
- Modify: `main/server/json_db_fallback.cjs`

**Steps:**
1. The `run` method's big if/else chain (L39-86) can be collapsed to a simpler map:
```js
const ops = {
    'good_proxies': (d, v) => { d.good_proxies = {id:1, data:v}; },
    'proxies': (d, v) => { d.proxies = {id:1, data:v}; },
    // ... etc
};
```
2. But the simplest ponytail cut: the fallback is only loaded when sqlite3 fails. Most users have sqlite3. Consider: does this file even need to be 137 lines? The `get` method (L87-104) does 8 regex matches per query.

**Decision:** Keep it as-is for now — it works. Mark as "defer" for later.

**Skip for now.** Mark file for later audit.

---

## Task 7: Remove deepCopy/deepEqual from background.ts

**Objective:** `deepCopy` (L53-55) uses `JSON.parse(JSON.stringify())`. `deepEqual` (L57-63) is a recursive object comparator. Modern JS has `structuredClone()`.

**Files:**
- Modify: `main/src/background.ts:L53-63`

**Steps:**
1. Replace `deepCopy(obj)` with `structuredClone(obj)`
2. Replace `deepEqual(a, b)` with `structuredClone(a) === structuredClone(b)` — or even simpler, use `JSON.stringify(a) === JSON.stringify(b)` since these are plain data objects
3. Delete both functions
4. Verify syntax
5. Commit: `git commit -m "stdlib: replace deepCopy/deepEqual with structuredClone"`

---

## Task 8: Audit fingerprint_generator.cjs

**Objective:** 756 lines, mostly static data. Identify what can be moved to JSON or removed.

**Files:**
- Review: `main/server/fingerprint_generator.cjs`

**Key cuts:**
1. **`genChromeFeatures()` (L338-393)** — 55 lines of static feature flags. Many are always `true`. Could be a data file.
2. **`genSafariFeatures()` (L395-424)** — 29 lines, similar pattern.
3. **`genFirefoxFeatures()` (L426-456)** — 30 lines, similar pattern.
4. **Font arrays** — windowsChrome (L42-77: 36 lines), macosSafari (L103-132: 30 lines), linuxFirefox (L174-196: 23 lines). These are static data.
5. **`windowsEdge.fonts` is null** (L232) — so 36 lines of Windows Chrome fonts are duplicated in Edge but unused for Edge.

**Decision:** Move font lists and feature flags to separate JSON data files. This is a bigger refactor — schedule as a separate task.

**Sub-task 8a:** Extract `genChromeFeatures`, `genSafariFeatures`, `genFirefoxFeatures` into a `features.json` data file and replace with a lookup function.
**Sub-task 8b:** Move font arrays to `fonts.json`.

---

## Task 9: Remove unused rumble_core import in generate_jobs.cjs

**Objective:** Check if Rumble videos are actually used.

**Files:**
- Review: `main/server/generate_jobs.cjs`

**Steps:**
1. `rumble_core` is imported at L1, used only in `generateJobs` L131 for `getVideoID`
2. `rumble_selfbot_api` is imported at L14 and used at L133
3. If Rumble is rarely/never used, these are dead code
4. **Keep for now** — both are used in the Rumble code path

---

## Task 10: Audit startWorker.cjs ad logic

**Objective:** Ad handling in `watchInterval` (L86-213) is complex with `adDetected`, `adPlayTime`, `watch_ads` setting. Check if `settings.watch_ads` is ever set.

**Files:**
- Check: `main/server/vars.cjs` — no `watch_ads` field (only `auto_skip_ads` and `max_seconds_ads`)
- Check: `main/src/background.ts` — no `watch_ads` field

**Finding:** `settings.watch_ads` (L111 in startWorker.cjs) is NEVER defined in vars or background. The `if (settings.watch_ads)` branch at L111 is effectively dead code — it will always be `undefined` (falsy), so only the `else` branch at L124-129 runs.

**Steps:**
1. Remove the dead `if (settings.watch_ads)` branch (L111-129), keep only the else body
2. Verify: `node -c main/server/startWorker.cjs`
3. Commit: `git commit -m "delete: remove dead settings.watch_ads branch (never defined)"`

---

## Task 11: Clean up init_start.cjs — remove unused random() function

**Objective:** `random()` function (L37-47) is used in extensions loading and `launchServer`. Check if it's still needed.

**Files:**
- Check: `global.makeGlobal` at L370 exports `random`

**Steps:**
1. Verify `random` is used by extensions (L420: `transformStatus` calls `startWorking`, not `random`)
2. `generate_jobs.cjs` uses `random()` at L66, L67, L70, L71, L80, etc. — but it uses its own `random()` from the global scope
3. Keep it — used globally

---

## Task 12: Verify console.log monkey-patch usage

**Objective:** `console.log/error/warn` are monkey-patched at L452-469 to also call `MakeLog`. Check if this is needed.

**Files:**
- `main/server/init_start.cjs:L452-469`

**Steps:**
1. These patches make every console call also write to log files
2. `MakeLog` writes to dated log files — this is useful for audit
3. Keep — it's the only way log files get written

---

## Task 13: Check for duplicate clamp function

**Objective:** `clamp` is defined in both `init_start.cjs` (L37-47, but only as `random`) and `startWorker.cjs` (L34-36).

**Files:**
- Check: Both files

**Finding:** `init_start.cjs` has `random()` at L37-47. `startWorker.cjs` has `clamp()` at L34-36. These are different functions. No duplicate.

**Skip.**

---

## Task 14: Remove verifyLoginStatus from init_server.cjs (duplicate confirmation)

Already in Task 2.

---

## Summary of Tasks by Priority

| # | File | Cut | Lines Saved |
|---|------|-----|-------------|
| 1 | startWorker.cjs | Inline convertProxyFormat, remove duplicate | ~20 |
| 2 | init_server.cjs | Remove dead verifyLoginStatus | ~6 |
| 3 | init_start.cjs | Remove dead MessageUser | ~13 |
| 4 | init_start.cjs | Inline computeStringDate/Time | ~15 |
| 7 | background.ts | structuredClone instead of deepCopy | ~10 |
| 10 | startWorker.cjs | Remove dead watch_ads branch | ~19 |
| 8a | fingerprint_generator.cjs | Extract feature flags to JSON | ~100 (deferred) |

**Total immediate savings: ~83 lines of dead/unnecessary code.**
