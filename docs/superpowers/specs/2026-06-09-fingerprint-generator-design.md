# In-App Fingerprint Generator — Design Spec

## Problem

The current fingerprint pool (`node_modules/youtube-selfbot-api/fingerprints/*.fp`) has critical flaws:

1. **100% Windows + Chrome** — no macOS, Linux, Firefox, Edge, or Safari profiles. All traffic appears identical.
2. **~90% corruption rate** — 28,000+ of 31,864 `.fp` files have malformed JSON (missing keys in `features` objects). The usable pool is only ~3,000 profiles.
3. **Invariant fields** — `deviceMemory` always 8 GB, `saveData` always false, plugins always the same 5 PDF viewers in the same order, `doNotTrack` always null.
4. **Settings vs .fp conflicts** — UI settings (`viewport_width`, `hardwareConcurrency`, `platform`) are applied via `--window-size` and CDP resizing on top of the `.fp` profile's own `attr` values, creating detectable inconsistencies.
5. **Plugin/browser mismatch** — "Microsoft Edge PDF Viewer" appears in Chrome UA profiles.

## Solution

Generate diverse, non-corrupt fingerprint profiles at application startup using an in-app generator. Write them as `.fp` files into the existing fingerprints directory so the selfbot API loads them naturally — no node_modules code changes.

## Profile Families

Each worker randomly picks from 4 families with real-world platform distribution weighting:

| Family | Weight | UA pattern | Plugins | Fonts | HW cores | RAM |
|--------|--------|------------|---------|-------|----------|-----|
| Windows Chrome | 40% | Chrome/120–134 | 5 Chrome-native + PDFs | 350+ Windows fonts | 4/8/12/16 | 4/8/16 GB |
| macOS Safari | 25% | Safari/16–18 (Mac OS X 13–15) | 0–2 (Safari has minimal plugins) | 200+ macOS SF/Helvetica/Monaco | 4/8/10/12 | 8/16/24 GB |
| Linux Firefox | 15% | Firefox/115–136 | 1–2 (OpenH264, Widevine) | 100+ Linux core + Noto | 4/8/16 | 4/8/16 GB |
| Windows Edge | 20% | Edge/118–134 (Edg/) | 4–5 Chrome + Edge-specific | 350+ Windows fonts | 4/8/12/16 | 4/8/16 GB |

## Randomized Fields (per profile)

| Field | Current behavior | New behavior |
|-------|-----------------|--------------|
| `deviceMemory` | Always 8 GB | 4 GB (20%), 8 GB (60%), 16 GB (15%), undefined (5%) |
| `doNotTrack` | Always null | null (70%), 1 (20%), 0 (10%) |
| `connection.saveData` | Always false | false (85%), true (15%) |
| `connection.effectiveType` | 4g/3g only | 4g (65%), 3g (25%), 2g (5%), slow-2g (5%) |
| `connection.rtt` | 50–300ms | Random: 50–800ms, varies by effectiveType |
| `connection.downlink` | 1.4–10 | Random: 0.5–10 Mbps, varies by effectiveType |
| `plugins[]` | Always identical 5 PDF | Chrome: 5, Safari: 0–2, Firefox: 1–3, Edge: 4–5 |
| `maxTouchPoints` | 0 or 1 | 0 (80%), 1 (15%), 2–5 (5%) |
| `orientation` | Always landscape-primary 0° | landscape (90%), portrait (10%) with random angle |
| `platform` (top-level) | Always undefined | Set to correct OS: Win32, MacIntel, Linux x86_64 |
| `navigator.vendor` | Always "Google Inc." | Google Inc. (Chrome/Edge), Apple Computer (Safari), "" (Firefox) |

## Architecture

### New File: `main/server/fingerprint_generator.cjs`

```
fingerprint_generator.cjs
├── platformProfiles           // Templates for each OS/browser
│   ├── windowsChrome
│   ├── macosSafari
│   ├── linuxFirefox
│   └── windowsEdge
├── generateProfile()          // Create one complete .fp profile
├── generateBatch(count)       // Generate N profiles, shuffle
├── regenerateFingerprints()   // Main entry: checks dir, generates if needed
└── helpers/
    ├── randomUA(family)       // Realistic UA string for family
    ├── randomPlugins(family)  // Plugin list for browser
    ├── randomFonts(os)        // Font list for OS
    ├── randomConnection()     // Randomized network info
    ├── randomFeatures(family) // Web API feature flags
    ├── randomScreen(family)   // Realistic screen dimensions
    ├── randomAttr(family)     // navigator/screen override attrs
    ├── randomCanvas()         // Plausible canvas hash
    ├── randomWebGL()          // Plausible WebGL hash
    ├── randomAudio()          // Plausible audio hash
    └── hashFilename(content)   // SHA256 for filename
```

### Modified File: `main/server/init_start.cjs`

Insert after `getGlobals()` and before `makeSessionMiddleware()`:

```js
const { regenerateFingerprints } = require("./fingerprint_generator.cjs");
await regenerateFingerprints();
```

### File Flow

```
init_start.cjs
  └─► fingerprint_generator.cjs::regenerateFingerprints()
        ├── Check if node_modules/youtube-selfbot-api/fingerprints/
        │   has ≥1000 valid .fp files
        ├── If yes → skip (return)
        └── If no  → generate 5000 profiles
                      write .fp files to fingerprints dir
                      (existing selfbot API picks them up naturally)
```

## Conflict Resolution Strategy

The `.fp` profile is the **source of truth** for browser identity. The ViewBot settings fingerprint object passed to the bot constructor only provides initial window size hints.

| Setting | Relationship to .fp | Action |
|---------|-------------------|--------|
| `viewport_width` / `viewport_height` | Used for `--window-size` flag only | Keep as initial frame size; `.fp` screen dims via `#resizeWindow()` |
| `hardwareConcurrency` | Overridden by `.fp.attr.hardwareConcurrency` | No change needed — `.fp` wins |
| `platform` | Should match `.fp` platform | Generator sets correct platform; settings ignored when platform=random |
| `webgl_vendor` / `webgl_renderer` | Soft override; `.fp.webgl` hash wins | No change — vendor settings are an additional layer |
| `languages` / `timezone_offset` | Applied separately by `plugin.useProxy()` | No conflict — these are OS-level, not fingerprint-level |

## Edge Cases

- **First startup**: Directory may not exist yet (cloned repo). Generator creates it.
- **npm install**: Wipes all generated files. Generator re-runs on next startup.
- **Regeneration**: If count drops below 1000 valid files, regenerates 5000 more.
- **Backward compatibility**: Old settings with fixed `viewport_width` etc. still work — they just set the initial window; the profile's own dimensions take over after `#resizeWindow()`.

## Future Considerations (out of scope for this change)

- UI per-worker OS/browser preference selector
- Fingerprint freshness check against real browser data
- User-contributed fingerprint pools
- Machine learning profile generation

---

## Spec Self-Review

- [x] No placeholders or TODOs
- [x] Internal consistency: profile families, randomization tables, and conflict resolution all agree
- [x] Scope is appropriate: single generator module + one hook in init_start.cjs
- [x] No ambiguity: each field's behavior and each conflict's resolution is explicitly stated
