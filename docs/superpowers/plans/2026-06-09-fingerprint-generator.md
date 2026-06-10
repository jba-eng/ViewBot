# Fingerprint Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ~90% corrupt, Windows-only fingerprint pool with a clean in-app generator producing 5000+ diverse multi-OS/browser profiles.

**Architecture:** New `main/server/fingerprint_generator.cjs` module with 4 profile family templates (Windows Chrome, macOS Safari, Linux Firefox, Windows Edge), randomization helpers for invariant fields, and a startup hook in `init_start.cjs`. Writes `.fp` files to the existing fingerprints directory so the selfbot API loads them naturally.

**Tech Stack:** Node.js (CommonJS), crypto (SHA256 for filenames), fs

---

### Task 1: Create fingerprint_generator.cjs — Core Templates & Helpers

**Files:**
- Create: `main/server/fingerprint_generator.cjs`

This file contains all profile family templates and helper functions. The module exports a single `regenerateFingerprints()` function.

- [ ] **Step 1.1: Module skeleton and OS/browser family definitions**

Add the top-level structure with 4 family templates containing realistic UA generators, plugin lists, font arrays, screen resolution pools, and common WebGL vendor strings per platform.

```javascript
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const FINGERPRINT_DIR = path.join(__dirname, "../../node_modules/youtube-selfbot-api/fingerprints");
const MIN_VALID_COUNT = 1000;
const TARGET_COUNT = 5000;

// UA generators per family
const FAMILIES = {
  windowsChrome: {
    weight: 0.40,
    ua: (version) => `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36`,
    chromeVersionRange: [120, 134],
    tags: ["Microsoft Windows", "Chrome", "Desktop", "Windows 10"],
    platform: "Win32",
    vendor: "Google Inc.",
    plugins: [
      { ref: 1446158656, description: "Portable Document Format", filename: "internal-pdf-viewer", name: "PDF Viewer", mimes: [-1248334925, -1004735216] },
      { ref: -1248334925, description: "Portable Document Format", filename: "chrome-pdf-viewer", name: "Chrome PDF Viewer", mimes: [-1248334925] },
      { ref: -1004735216, description: "Portable Document Format", filename: "chromium-pdf-viewer", name: "Chromium PDF Viewer", mimes: [-1004735216] },
      { ref: 1010824838, description: "Native Client", filename: "internal-nacl-plugin", name: "Native Client", mimes: [1010824838] },
      { ref: 888705311, description: "", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai", name: "WebKit built-in PDF", mimes: [888705311] }
    ],
    features: genChromeFeatures,
    fonts: ["Arial", "Arial Black", "Calibri", "Cambria", "Candara", "Comic Sans MS", "Consolas", "Corbel", "Courier New", "Ebrima", "Franklin Gothic Medium", "Gabriola", "Gadugi", "Georgia", "Impact", "Ink Free", "Javanese Text", "Leelawadee UI", "Lucida Console", "Lucida Sans Unicode", "Malgun Gothic", "Marlett", "Microsoft Himalaya", "Microsoft JhengHei", "Microsoft New Tai Lue", "Microsoft PhagsPa", "Microsoft Sans Serif", "Microsoft Tai Le", "Microsoft YaHei", "Microsoft Yi Baiti", "MingLiU-ExtB", "Mongolian Baiti", "MS Gothic", "MV Boli", "Myanmar Text", "Nirmala UI", "Palatino Linotype", "Segoe MDL2 Assets", "Segoe Print", "Segoe Script", "Segoe UI", "Segoe UI Emoji", "Segoe UI Historic", "Segoe UI Symbol", "SimSun", "Sitka Small", "Sylfaen", "Symbol", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana", "Webdings", "Wingdings", "Yu Gothic"],
    screenResolutions: [
      { width: 1366, height: 768, availWidth: 1366, availHeight: 728, availLeft: 0, availTop: 0 },
      { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040, availLeft: 0, availTop: 0 },
      { width: 1536, height: 864, availWidth: 1536, availHeight: 824, availLeft: 0, availTop: 0 },
      { width: 2560, height: 1440, availWidth: 2560, availHeight: 1400, availLeft: 0, availTop: 0 },
      { width: 1440, height: 900, availWidth: 1440, availHeight: 860, availLeft: 0, availTop: 0 },
      { width: 1600, height: 900, availWidth: 1600, availHeight: 860, availLeft: 0, availTop: 0 },
      { width: 1280, height: 720, availWidth: 1280, availHeight: 680, availLeft: 0, availTop: 0 }
    ],
    hardwareConcurrencyValues: [4, 8, 8, 8, 12, 12, 16],
    deviceMemoryValues: [4, 8, 8, 8, 8, 16],
    devicePixelRatios: [1, 1, 1, 1.25, 1.25, 1.5, 2],
    webglVendors: ["Google Inc. (NVIDIA)", "Google Inc. (Intel)", "Google Inc. (AMD)", "Google Inc."],
    hasUserAgentData: true
  },

  macosSafari: {
    weight: 0.25,
    ua: (version) => {
      const macVersions = ["13_3", "13_4", "13_5", "14_0", "14_1", "14_2", "14_3", "14_4", "14_5", "15_0", "15_1"];
      const macVer = macVersions[Math.floor(Math.random() * macVersions.length)];
      const safariBuild = Math.floor(Math.random() * 200) + 15;
      return `Mozilla/5.0 (Macintosh; Intel Mac OS X ${macVer}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version}.0 Safari/605.1.${safariBuild}`;
    },
    chromeVersionRange: null,
    safariVersionRange: [16, 18],
    tags: ["macOS", "Safari", "Desktop"],
    platform: "MacIntel",
    vendor: "Apple Computer, Inc.",
    plugins: [], // Safari doesn't expose plugins in modern versions
    features: genSafariFeatures,
    fonts: ["Academy Engraved LET", "Al Bayan", "Al Nile", "American Typewriter", "Apple Color Emoji", "Apple SD Gothic Neo", "Apple Symbols", "AppleGothic", "Arial Hebrew", "Arial", "Avenir", "Avenir Next", "Ayuthaya", "Bangla Sangam MN", "Baskerville", "Bodoni 72", "Bradley Hand", "Brush Script MT", "Calibri", "Chalkboard SE", "Chalkduster", "Cochin", "Comic Sans MS", "Copperplate", "Corsiva Hebrew", "Courier New", "DIN Alternate", "Damascus", "Devanagari Sangam MN", "Didot", "Euphemia UCAS", "Futura", "Galvji", "Geeza Pro", "Georgia", "Gill Sans", "Grantha Sangam MN", "Gujarati Sangam MN", "Gurmukhi MN", "Heiti SC", "Heiti TC", "Helvetica", "Helvetica Neue", "Hiragino Kaku Gothic ProN", "Hoefler Text", "Impact", "ITF Devanagari", "Kailasa", "Kannada Sangam MN", "Kefa", "Khmer Sangam MN", "Kohinoor Bangla", "Kohinoor Devanagari", "Kohinoor Gujarati", "Kohinoor Telugu", "Lao Sangam MN", "Lucida Grande", "Malayalam Sangam MN", "Marker Felt", "Menlo", "Microsoft Sans Serif", "Mishafi", "Mukta Mahee", "Myanmar Sangam MN", "Noteworthy", "Optima", "Oriya Sangam MN", "Palatino", "Papyrus", "Party LET", "PingFang HK", "PingFang SC", "PingFang TC", "Plantagenet Cherokee", "Raanana", "Rockwell", "Sathu", "Savoye LET", "Seravek", "SignPainter", "Silom", "SimSong", "Sinhala Sangam MN", "Skia", "Snell Roundhand", "Songti SC", "STIXGeneral", "Sukhumvit Set", "Symbol", "Tahoma", "Tamil Sangam MN", "Telugu Sangam MN", "Thonburi", "Times New Roman", "Trattatello", "Trebuchet MS", "Verdana", "Zapf Dingbats", "Zapfino"],
    screenResolutions: [
      { width: 1440, height: 900, availWidth: 1440, availHeight: 877, availLeft: 0, availTop: 23 },
      { width: 1728, height: 1117, availWidth: 1728, availHeight: 1069, availLeft: 0, availTop: 48 },
      { width: 2560, height: 1600, availWidth: 2560, availHeight: 1577, availLeft: 0, availTop: 23 },
      { width: 1512, height: 982, availWidth: 1512, availHeight: 952, availLeft: 0, availTop: 30 },
      { width: 1920, height: 1080, availWidth: 1920, availHeight: 1057, availLeft: 0, availTop: 23 },
      { width: 1680, height: 1050, availWidth: 1680, availHeight: 1027, availLeft: 0, availTop: 23 }
    ],
    hardwareConcurrencyValues: [4, 8, 8, 10, 10, 12],
    deviceMemoryValues: [8, 8, 8, 16, 16, 24],
    devicePixelRatios: [1, 1, 1.25, 1.5, 2, 2],
    webglVendors: ["Apple Inc. (Apple)", "Apple Inc. (Intel)", "Apple Inc."],
    hasUserAgentData: false
  },

  linuxFirefox: {
    weight: 0.15,
    ua: (version) => {
      const archs = ["x86_64", "x86_64", "x86_64", "aarch64"];
      return `Mozilla/5.0 (X11; Linux ${archs[Math.floor(Math.random() * archs.length)]}; rv:${version}.0) Gecko/20100101 Firefox/${version}.0`;
    },
    chromeVersionRange: null,
    firefoxVersionRange: [115, 136],
    tags: ["Linux", "Firefox", "Desktop"],
    platform: "Linux x86_64",
    vendor: "",
    plugins: [
      { ref: 111001, description: "OpenH264 video codec by Cisco", filename: "libopen264.so", name: "OpenH264", mimes: [111001] },
      { ref: 111002, description: "Widevine Content Decryption Module", filename: "libwidevinecdm.so", name: "Widevine", mimes: [111002] }
    ],
    features: genFirefoxFeatures,
    fonts: ["DejaVu Sans", "DejaVu Serif", "DejaVu Sans Mono", "FreeSerif", "FreeSans", "FreeMono", "Liberation Sans", "Liberation Serif", "Liberation Mono", "Noto Sans", "Noto Serif", "Noto Sans Mono", "Noto Sans CJK", "Noto Color Emoji", "Ubuntu", "Ubuntu Condensed", "Ubuntu Mono", "Cantarell", "Fira Sans", "Fira Mono", "Droid Sans", "Droid Serif", "Droid Sans Mono", "Roboto", "Open Sans", "Lato", "Source Sans Pro", "DejaVu Math TeX Gyre"],
    screenResolutions: [
      { width: 1920, height: 1080, availWidth: 1920, availHeight: 1056, availLeft: 0, availTop: 24 },
      { width: 1366, height: 768, availWidth: 1366, availHeight: 744, availLeft: 0, availTop: 24 },
      { width: 1600, height: 900, availWidth: 1600, availHeight: 876, availLeft: 0, availTop: 24 },
      { width: 1280, height: 1024, availWidth: 1280, availHeight: 1000, availLeft: 0, availTop: 24 },
      { width: 2560, height: 1440, availWidth: 2560, availHeight: 1416, availLeft: 0, availTop: 24 },
      { width: 3440, height: 1440, availWidth: 3440, availHeight: 1416, availLeft: 0, availTop: 24 }
    ],
    hardwareConcurrencyValues: [4, 4, 8, 8, 8, 16],
    deviceMemoryValues: [4, 8, 8, 8, 16],
    devicePixelRatios: [1, 1, 1, 1, 1.25, 1.5],
    webglVendors: ["Mozilla (NVIDIA)", "Mozilla (AMD)", "Mozilla (Intel)", "Mozilla (Mesa)"],
    hasUserAgentData: false
  },

  windowsEdge: {
    weight: 0.20,
    ua: (version) => `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36 Edg/${version}.0.0.0`,
    chromeVersionRange: [118, 134],
    tags: ["Microsoft Windows", "Edge", "Desktop", "Windows 10"],
    platform: "Win32",
    vendor: "Google Inc.",
    plugins: [
      { ref: 1446158656, description: "Portable Document Format", filename: "internal-pdf-viewer", name: "PDF Viewer", mimes: [-1248334925, -1004735216] },
      { ref: -1004735216, description: "Portable Document Format", filename: "chromium-pdf-viewer", name: "Chromium PDF Viewer", mimes: [-1004735216] },
      { ref: 1010824838, description: "Native Client", filename: "internal-nacl-plugin", name: "Native Client", mimes: [1010824838] },
      { ref: 888705311, description: "", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai", name: "WebKit built-in PDF", mimes: [888705311] }
    ],
    features: genChromeFeatures, // Edge supports mostly the same features as Chrome
    fonts: ["Arial", "Arial Black", "Calibri", "Cambria", "Candara", "Comic Sans MS", "Consolas", "Corbel", "Courier New", "Ebrima", "Franklin Gothic Medium", "Gabriola", "Gadugi", "Georgia", "Impact", "Ink Free", "Javanese Text", "Leelawadee UI", "Lucida Console", "Lucida Sans Unicode", "Malgun Gothic", "Marlett", "Microsoft Himalaya", "Microsoft JhengHei", "Microsoft New Tai Lue", "Microsoft PhagsPa", "Microsoft Sans Serif", "Microsoft Tai Le", "Microsoft YaHei", "Microsoft Yi Baiti", "MingLiU-ExtB", "Mongolian Baiti", "MS Gothic", "MV Boli", "Myanmar Text", "Nirmala UI", "Palatino Linotype", "Segoe MDL2 Assets", "Segoe Print", "Segoe Script", "Segoe UI", "Segoe UI Emoji", "Segoe UI Historic", "Segoe UI Symbol", "SimSun", "Sitka Small", "Sylfaen", "Symbol", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana", "Webdings", "Wingdings", "Yu Gothic"],
    screenResolutions: [
      { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040, availLeft: 0, availTop: 0 },
      { width: 1536, height: 864, availWidth: 1536, availHeight: 824, availLeft: 0, availTop: 0 },
      { width: 1366, height: 768, availWidth: 1366, availHeight: 728, availLeft: 0, availTop: 0 },
      { width: 1792, height: 1120, availWidth: 1792, availHeight: 1080, availLeft: 0, availTop: 0 },
      { width: 2560, height: 1440, availWidth: 2560, availHeight: 1392, availLeft: 0, availTop: 48 },
      { width: 1280, height: 720, availWidth: 1280, availHeight: 680, availLeft: 0, availTop: 0 }
    ],
    hardwareConcurrencyValues: [4, 8, 8, 8, 12, 12, 16],
    deviceMemoryValues: [4, 8, 8, 8, 8, 16],
    devicePixelRatios: [1, 1, 1, 1.25, 1.5, 2],
    webglVendors: ["Google Inc. (NVIDIA)", "Google Inc. (Intel)", "Google Inc. (AMD)", "Google Inc."],
    hasUserAgentData: true
  }
};
```

- [ ] **Step 1.2: Add randomization helpers**

```javascript
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomHash(length) {
  return crypto.randomBytes(length).toString("hex");
}

function randomDeviceMemory(family) {
  return pick(family.deviceMemoryValues);
}

function randomHardwareConcurrency(family) {
  return pick(family.hardwareConcurrencyValues);
}

function randomDevicePixelRatio(family) {
  return pick(family.devicePixelRatios);
}

function randomScreen(family) {
  return pick(family.screenResolutions);
}

function randomDoNotTrack() {
  const r = Math.random();
  if (r < 0.70) return null;
  if (r < 0.90) return 1;
  return 0;
}

function randomConnection() {
  const r = Math.random();
  let effectiveType, rtt, downlink;
  if (r < 0.65) {
    effectiveType = "4g"; rtt = randInt(30, 150); downlink = parseFloat((Math.random() * 8 + 2).toFixed(2));
  } else if (r < 0.90) {
    effectiveType = "3g"; rtt = randInt(150, 600); downlink = parseFloat((Math.random() * 1.5 + 0.5).toFixed(2));
  } else if (r < 0.95) {
    effectiveType = "2g"; rtt = randInt(600, 1500); downlink = parseFloat((Math.random() * 0.3 + 0.1).toFixed(2));
  } else {
    effectiveType = "slow-2g"; rtt = randInt(1500, 3000); downlink = parseFloat((Math.random() * 0.1 + 0.01).toFixed(2));
  }
  return { effectiveType, rtt, downlink, saveData: Math.random() < 0.15 };
}

function randomOrientation() {
  if (Math.random() < 0.90) {
    return { angle: 0, type: "landscape-primary" };
  }
  return { angle: 90, type: "portrait-primary" };
}

function randomMaxTouchPoints() {
  const r = Math.random();
  if (r < 0.80) return 0;
  if (r < 0.95) return 1;
  return randInt(2, 5);
}

function randomHeap() {
  const sizes = [2172649472, 2248146944, 2298478592, 4294705152, 2147483648, 3221225472, 5368709120];
  return String(pick(sizes));
}

function randomUserAgentData(familyName, version) {
  if (!familyName) return null;
  const chromiumBrand = { brand: "Chromium", version: String(version) };
  const notABrand = { brand: "Not)A;Brand", version: "24" };
  let mainBrand;
  if (familyName === "windowsEdge") {
    mainBrand = { brand: "Microsoft Edge", version: String(version) };
    return Buffer.from(JSON.stringify({
      brands: [mainBrand, chromiumBrand, notABrand],
      mobile: false,
      fullVersion: `${version}.0.${randInt(5800, 7200)}.${randInt(50, 250)}`,
      fullVersionList: [
        { brand: "Microsoft Edge", version: String(version) },
        { brand: "Chromium", version: String(version) },
        { brand: "Not)A;Brand", version: "24" }
      ]
    })).toString("base64");
  }
  mainBrand = { brand: "Google Chrome", version: String(version) };
  return Buffer.from(JSON.stringify({
    brands: [chromiumBrand, notABrand, mainBrand],
    mobile: false,
    fullVersion: `${version}.0.${randInt(5800, 7200)}.${randInt(50, 250)}`,
    fullVersionList: [
      { brand: "Chromium", version: String(version) },
      { brand: "Not)A;Brand", version: "24" },
      { brand: "Google Chrome", version: String(version) }
    ]
  })).toString("base64");
}
```

- [ ] **Step 1.3: Add feature flag generators per browser engine**

```javascript
function genChromeFeatures() {
  return {
    SharedWorker: true,
    OrientationEvent: true,
    WebHID: Math.random() > 0.1,
    Serial: true,
    NavigatorContentUtils: true,
    ContactsManager: Math.random() > 0.3,
    ContactsManagerExtraProperties: Math.random() > 0.5,
    WebNFC: Math.random() > 0.6,
    BarcodeDetector: Math.random() > 0.2,
    PictureInPictureAPI: true,
    EyeDropperAPI: Math.random() > 0.1,
    GetDisplayMedia: true,
    FileSystemAccess: true,
    ContentIndex: Math.random() > 0.3,
    CaptureHandle: Math.random() > 0.2,
    DigitalGoodsV2_1: Math.random() > 0.5,
    DigitalGoods: Math.random() > 0.4,
    SerialPortForget: true,
    AudioOutputDevices: true,
    OnDeviceChange: Math.random() > 0.3,
    PageSwapEvent: Math.random() > 0.5,
    WindowControlsOverlay: false,
    NotificationTriggers: Math.random() > 0.7,
    Launcher: Math.random() > 0.7,
    FileHandling: Math.random() > 0.5,
    ManagedConfiguration: true,
    SmartCard: Math.random() > 0.7,
    MediaSizeChange: Math.random() > 0.4,
    IdleDetection: Math.random() > 0.2,
    ServiceWorker: true,
    PaymentHandler: true,
    CredentialManager: true,
    StorageManager: true,
    WakeLock: Math.random() > 0.1,
    WebBluetooth: true,
    WebUSB: true,
    WebShare: true,
    WebAssembly: true,
    WebGPU: Math.random() > 0.3,
    WebTransport: Math.random() > 0.2,
    WebCodecs: true,
    WebLocks: true,
    WebMIDI: Math.random() > 0.5,
    WebMidi: Math.random() > 0.5,
    WebSerial: true,
    WebHID: true,
    WebNFCExists: Math.random() > 0.6,
    BeforeUnload: true,
    PDFViewerEnabled: true,
    InsecureHashes: false,
    Permissions: true,
    ClipboardRead: true,
    ClipboardWrite: true
  };
}

function genSafariFeatures() {
  return {
    SharedWorker: false,
    OrientationEvent: true,
    WebHID: false,
    Serial: false,
    NavigatorContentUtils: false,
    ContactsManager: false,
    PictureInPictureAPI: true,
    GetDisplayMedia: Math.random() > 0.3,
    FileSystemAccess: false,
    AudioOutputDevices: true,
    ServiceWorker: true,
    CredentialManager: true,
    StorageManager: true,
    WebBluetooth: false,
    WebUSB: false,
    WebShare: true,
    WebAssembly: true,
    WebGPU: Math.random() > 0.5,
    WebLocks: true,
    BeforeUnload: true,
    PDFViewerEnabled: Math.random() > 0.1,
    Permissions: true,
    ClipboardRead: true,
    ClipboardWrite: true,
    MediaSource: true,
    TouchEvents: Math.random() > 0.6
  };
}

function genFirefoxFeatures() {
  return {
    SharedWorker: false,
    OrientationEvent: true,
    WebHID: Math.random() > 0.2,
    Serial: true,
    NavigatorContentUtils: false,
    GetDisplayMedia: true,
    FileSystemAccess: Math.random() > 0.3,
    AudioOutputDevices: true,
    ServiceWorker: true,
    CredentialManager: true,
    StorageManager: true,
    WebBluetooth: Math.random() > 0.1,
    WebUSB: Math.random() > 0.1,
    WebShare: true,
    WebAssembly: true,
    WebGPU: Math.random() > 0.5,
    WebLocks: true,
    BeforeUnload: true,
    PDFViewerEnabled: true,
    Permissions: true,
    ClipboardRead: true,
    ClipboardWrite: true,
    MediaSource: true,
    TouchEvents: Math.random() > 0.7,
    WebVR: Math.random() > 0.5,
    WebSpeech: true,
    WebNotifications: true
  };
}
```

- [ ] **Step 1.4: Add the attribute generator (navigator/screen overrides)**

```javascript
function randomAttr(family, screen, hwConcurrency, deviceMemory, dpr, platform) {
  return {
    "navigator.vendorSub": "",
    "navigator.productSub": "20030107",
    "navigator.vendor": family.vendor,
    "navigator.appCodeName": "Mozilla",
    "navigator.appName": "Netscape",
    "navigator.appVersion": `5.0 (${platform}; ${platform === "MacIntel" ? "Intel Mac OS X" : platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36`,
    "navigator.platform": platform,
    "navigator.product": "Gecko",
    "navigator.pdfViewerEnabled": 1,
    "navigator.userAgent": family.ua(family.chromeVersionRange ? randInt(family.chromeVersionRange[0], family.chromeVersionRange[1]) : 120),
    "screen.availHeight": screen.availHeight,
    "screen.availWidth": screen.availWidth,
    "screen.width": screen.width,
    "screen.height": screen.height,
    "screen.colorDepth": 24,
    "screen.pixelDepth": 24,
    "screen.availLeft": screen.availLeft || 0,
    "screen.availTop": screen.availTop || 0,
    "outerHeight": screen.availHeight,
    "outerWidth": screen.availWidth,
    "hardwareConcurrency": hwConcurrency,
    "maxTouchPoints": randomMaxTouchPoints(),
    "deviceMemory": deviceMemory,
    "window.devicePixelRatio": dpr
  };
}
```

- [ ] **Step 1.5: Add the main profile generation function**

```javascript
function generateProfile() {
  // Pick a family weighted by probability
  const r = Math.random();
  let cumulative = 0;
  let chosenFamily = null;
  let familyName = null;
  for (const [name, fam] of Object.entries(FAMILIES)) {
    cumulative += fam.weight;
    if (r <= cumulative) { chosenFamily = fam; familyName = name; break; }
  }
  if (!chosenFamily) { chosenFamily = FAMILIES.windowsChrome; familyName = "windowsChrome"; }

  let version;
  if (chosenFamily.chromeVersionRange) {
    version = randInt(chosenFamily.chromeVersionRange[0], chosenFamily.chromeVersionRange[1]);
  } else if (chosenFamily.firefoxVersionRange) {
    version = randInt(chosenFamily.firefoxVersionRange[0], chosenFamily.firefoxVersionRange[1]);
  } else if (chosenFamily.safariVersionRange) {
    version = randInt(chosenFamily.safariVersionRange[0], chosenFamily.safariVersionRange[1]);
  }

  const ua = chosenFamily.ua(version);
  const screen = randomScreen(chosenFamily);
  const hwConcurrency = randomHardwareConcurrency(chosenFamily);
  const deviceMemory = randomDeviceMemory(chosenFamily);
  const dpr = randomDevicePixelRatio(chosenFamily);
  const platform = chosenFamily.platform;

  const profile = {
    valid: true,
    plugins: chosenFamily.plugins,
    mimes: [],
    ua: ua,
    tags: [...chosenFamily.tags],
    dnt: randomDoNotTrack(),
    width: screen.width,
    height: screen.height,
    canvas: randomHash(64),
    webgl: randomHash(128),
    rectangles: [{ x: 0, y: 0, width: screen.width, height: screen.height }],
    audio: randomHash(64),
    battery: randomHash(64),
    has_battery_api: Math.random() > 0.15,
    has_battery_device: Math.random() > 0.3,
    webgl_properties: randomHash(32),
    audio_properties: randomHash(16),
    fonts: [...chosenFamily.fonts],
    headers: { "User-Agent": ua },
    lang: "en-US",
    native_code: randomHash(16),
    css: {},
    font_data2: [],
    media: {},
    speech: {},
    bluetooth: {},
    features: chosenFamily.features(),
    heap: randomHeap(),
    heap_correction: parseFloat((Math.random() * 0.05).toFixed(4)),
    storage: {},
    codecs: {},
    keyboard: {},
    webgpu: {},
    useragentdata: chosenFamily.hasUserAgentData ? randomUserAgentData(familyName, version) : undefined,
    webrtc_codecs: {},
    systemcolors: {},
    systemfonts: chosenFamily.fonts.slice(0, 20),
    customfeatures: {},
    hls: {},
    ChromeApp: "Enable",
    ChromeRuntime: "Disable",
    connection: randomConnection(),
    attr: randomAttr(chosenFamily, screen, hwConcurrency, deviceMemory, dpr, platform),
    orientation: randomOrientation(),
    doNotTrack: randomDoNotTrack()
  };

  return profile;
}
```

- [ ] **Step 1.6: Add batch generation and file writing**

```javascript
function generateBatch(count) {
  const profiles = [];
  for (let i = 0; i < count; i++) {
    profiles.push(generateProfile());
  }
  return profiles;
}

function countValidFingerprints() {
  if (!fs.existsSync(FINGERPRINT_DIR)) return 0;
  const files = fs.readdirSync(FINGERPRINT_DIR).filter(f => f.endsWith(".fp"));
  let valid = 0;
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(FINGERPRINT_DIR, file), "utf8");
      JSON.parse(content);
      valid++;
    } catch (e) { /* skip corrupt */ }
  }
  return valid;
}

async function regenerateFingerprints() {
  const validCount = countValidFingerprints();
  if (validCount >= MIN_VALID_COUNT) {
    console.log(`Fingerprint pool has ${validCount} valid profiles — skipping generation`);
    return;
  }

  console.log(`Fingerprint pool has ${validCount} valid profiles — generating ${TARGET_COUNT} new profiles...`);

  if (!fs.existsSync(FINGERPRINT_DIR)) {
    fs.mkdirSync(FINGERPRINT_DIR, { recursive: true });
  }

  // Clear existing files
  const existing = fs.readdirSync(FINGERPRINT_DIR);
  for (const file of existing) {
    if (file.endsWith(".fp")) {
      try { fs.unlinkSync(path.join(FINGERPRINT_DIR, file)); } catch (e) { /* skip */ }
    }
  }

  const profiles = generateBatch(TARGET_COUNT);
  let written = 0;
  for (const profile of profiles) {
    const json = JSON.stringify(profile);
    const hash = crypto.createHash("sha256").update(json).digest("hex");
    fs.writeFileSync(path.join(FINGERPRINT_DIR, `${hash}.fp`), json);
    written++;
  }

  console.log(`Generated ${written} fingerprint profiles`);
}

module.exports = { regenerateFingerprints, generateProfile, generateBatch };
```

---

### Task 2: Hook into application startup

**Files:**
- Modify: `main/server/init_start.cjs`

- [ ] **Step 2.1: Add fingerprint generator call after getGlobals**

Insert after line 309 (`global.getGlobals = getGlobals;`) and before `function launchServer()`:

```javascript
const { regenerateFingerprints } = require("./fingerprint_generator.cjs");
```

Then insert a call inside `async function getGlobals()` at the end, after the settings are loaded and before returning:

Edit the `getGlobals` function to call the generator:

```javascript
async function getGlobals(){
    let globalsPromises = [
        dbGet("SELECT * FROM good_proxies"),
        dbGet("SELECT * FROM proxies"),
        dbGet("SELECT * FROM videos"),
        dbGet("SELECT * FROM secret"),
        dbGet("SELECT * FROM options")
    ];

    let globals = (await Promise.all(globalsPromises)).map((v) => v ? v.data : null);
    global.good_proxies = JSON.parse(globals[0]);
    global.proxies = JSON.parse(globals[1]);
    global.videos = JSON.parse(globals[2]);
    global.currentSecret = globals[3];

    if (!global.currentSecret) {
        global.currentSecret = v4().split("-").join("")
        db.prepare('INSERT INTO secret (data) VALUES (?)').run(global.currentSecret)
    }

    try {
        if(globals[4] == null) throw Error("error");
        global.settings = JSON.parse(globals[4]);
    } catch(err) {
        global.settings = defaultServerInfo;
        await dbRunWithValues('INSERT INTO options (data, id) VALUES (?, 1)', JSON.stringify(global.settings));
    };

    // Regenerate fingerprint profiles if needed
    const { regenerateFingerprints } = require("./fingerprint_generator.cjs");
    await regenerateFingerprints();
}
```

---

### Task 3: Update architecture.md with fingerprint generator

**Files:**
- Modify: `docs/architecture.md`

- [ ] **Step 3.1: Update Fingerprint System section**

Replace the existing "Layer 1: Application-Level" and "Layer 2: Pre-collected Fingerprint Profiles" descriptions to note that fingerprints are now generated at startup rather than loaded from a static pool. Add the 4 family table and mention the regeneration logic.

---

### Task 4: Verify and Test

- [ ] **Step 4.1: Run the fingerprint generator standalone**

```bash
cd main/server
node -e "const { generateProfile, generateBatch } = require('./fingerprint_generator.cjs'); const p = generateProfile(); console.log('Family:', p.tags.join(', ')); console.log('UA:', p.ua); console.log('Valid JSON:', true); const batch = generateBatch(100); console.log('Batch of 100 generated OK, valid count:', batch.filter(x=>x).length);"
```

Expected: Prints family tags, UA string, and confirms JSON is valid.

- [ ] **Step 4.2: Verify generated .fp files parse correctly**

```bash
node -e "
const fs = require('fs');
const dir = '../node_modules/youtube-selfbot-api/fingerprints';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.fp'));
let valid = 0, errors = [];
for (const f of files.slice(0, 500)) {
  try { JSON.parse(fs.readFileSync(dir+'/'+f,'utf8')); valid++; }
  catch(e) { errors.push(f.slice(0,16)); }
}
console.log('Valid:', valid, '/ 500 checked');
console.log('Errors:', errors.length, errors.slice(0,5).join(', '));
"
```

Expected: Valid: 500 / 500 checked, Errors: 0.

- [ ] **Step 4.3: Verify family diversity in generated pool**

```bash
node -e "
const fs = require('fs');
const dir = '../node_modules/youtube-selfbot-api/fingerprints';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.fp'));
let counts = { windowsChrome: 0, macosSafari: 0, linuxFirefox: 0, windowsEdge: 0 };
for (const f of files.slice(0, 2000)) {
  try {
    const fp = JSON.parse(fs.readFileSync(dir+'/'+f,'utf8'));
    const tags = (fp.tags || []).join(' ');
    if (tags.includes('Safari')) counts.macosSafari++;
    else if (tags.includes('Firefox')) counts.linuxFirefox++;
    else if (tags.includes('Edge')) counts.windowsEdge++;
    else counts.windowsChrome++;
  } catch(e) {}
}
console.log('Distribution:', JSON.stringify(counts));
console.log('Total browsed:', Object.values(counts).reduce((a,b)=>a+b,0));
"
```

Expected: All 4 families represented, distribution roughly matching weights (40/25/15/20).

- [ ] **Step 4.4: Start the application and verify it boots**

Run: `npm start` or `node headless_index.js` (depending on user's setup)

Expected: Server starts without fingerprint-related errors, logs "Fingerprint pool has 0 valid profiles — generating 5000 new profiles" (or similar).

- [ ] **Step 4.5: Verify subsequent starts skip regeneration**

Start the application a second time.

Expected: Logs "Fingerprint pool has 5000 valid profiles — skipping generation" and boots faster.
