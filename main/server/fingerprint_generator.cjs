const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const FINGERPRINT_DIR = path.join(__dirname, "../../node_modules/youtube-selfbot-api/fingerprints");

const families = {
  windowsChrome: {
    weight: 0.40,
    uaTemplate: (v) => `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.0.0 Safari/537.36`,
    versionRange: [120, 134],
    tags: ["Microsoft Windows", "Chrome", "Desktop", "Windows 10"],
    platform: "Win32",
    vendor: "Google Inc.",
    vendorSub: "",
    productSub: "20030107",
    appCodeName: "Mozilla",
    appName: "Netscape",
    appVersion: (v) => `5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.0.0 Safari/537.36`,
    product: "Gecko",
    pdfViewerEnabled: true,
    pluginCount: 5,
    plugins: [
      { description: "Portable Document Format", filename: "internal-pdf-viewer", name: "PDF Viewer" },
      { description: "Portable Document Format", filename: "internal-pdf-viewer", name: "Chrome PDF Viewer" },
      { description: "Portable Document Format", filename: "internal-pdf-viewer", name: "Chromium PDF Viewer" },
      { description: "Native Client Executable", filename: "internal-native-client", name: "Native Client" },
      { description: "Portable Document Format", filename: "internal-pdf-viewer", name: "WebKit built-in PDF" },
    ],
    mimeTypes: [
      { description: "Portable Document Format", suffix: "pdf", type: "application/pdf" },
      { description: "Portable Document Format", suffix: "pdf", type: "text/pdf" },
      { description: "Portable Native Client Executable", suffix: "pnacl", type: "application/pnacl" },
      { description: "Native Client Executable", suffix: "nexe", type: "application/x-nacl" },
    ],
    screenResolutions: [[1366, 768], [1920, 1080], [1536, 864], [2560, 1440], [1440, 900], [1600, 900], [1280, 720]],
    hwConcurrencyValues: [4, 8, 8, 8, 12, 12, 16],
    deviceMemoryValues: [4, 8, 8, 8, 8, 16],
    devicePixelRatios: [1, 1, 1, 1.25, 1.25, 1.5, 2],
    hasUserAgentData: true,
    languages: ["en-US", "en"],
    fonts: [
      "Arial", "Arial Black", "Arial Narrow", "Bahnschrift", "Baskerville Old Face", "Bauhaus 93", "Bell MT",
      "Bodoni MT", "Book Antiqua", "Bookman Old Style", "Calibri", "Cambria", "Cambria Math", "Candara",
      "Century Gothic", "Century Schoolbook", "Colonna MT", "Comic Sans MS", "Consolas", "Constantia",
      "Cooper Black", "Copperplate Gothic Bold", "Courier New", "Curlz MT", "Ebrima", "Elephant",
      "Engravers MT", "Eras Bold ITC", "Eras Demi ITC", "Eras Light ITC", "Eras Medium ITC",
      "Felix Titling", "Forte", "Franklin Gothic Book", "Franklin Gothic Demi", "Franklin Gothic Demi Cond",
      "Franklin Gothic Heavy", "Franklin Gothic Medium", "Franklin Gothic Medium Cond", "Freestyle Script",
      "French Script MT", "Gabriola", "Gadugi", "Garamond", "Georgia", "Gigi", "Gill Sans MT",
      "Gill Sans MT Condensed", "Gill Sans MT Ext Condensed Bold", "Gill Sans Ultra Bold",
      "Gill Sans Ultra Bold Condensed", "Gloucester MT Extra Condensed", "Goudy Old Style",
      "Goudy Stout", "Haettenschweiler", "Harlow Solid Italic", "Harrington", "High Tower Text",
      "HoloLens MDL2 Assets", "Impact", "Imprint MT Shadow", "Informal Roman", "Ink Free",
      "Javanese Text", "Jokerman", "Juice ITC", "Kristen ITC", "Kunstler Script", "Latha",
      "Leelawadee", "Leelawadee UI", "Lucida Bright", "Lucida Calligraphy", "Lucida Console",
      "Lucida Fax", "Lucida Handwriting", "Lucida Sans", "Lucida Sans Typewriter", "Lucida Sans Unicode",
      "Magneto", "Maiandra GD", "Malgun Gothic", "Mangal", "Marlett", "Matura MT Script Capitals",
      "Microsoft Himalaya", "Microsoft JhengHei", "Microsoft New Tai Lue", "Microsoft PhagsPa",
      "Microsoft Sans Serif", "Microsoft Tai Le", "Microsoft YaHei", "Microsoft Yi Baiti",
      "MingLiU_HKSCS", "MingLiU_HKSCS-ExtB", "MingLiU", "MingLiU-ExtB", "Mistral", "Modern No. 20",
      "Mongolian Baiti", "Monotype Corsiva", "MS Gothic", "MS Mincho", "MS Outlook", "MS PGothic",
      "MS PMincho", "MS Reference Sans Serif", "MS Reference Specialty", "MS UI Gothic", "MT Extra",
      "MV Boli", "Myanmar Text", "Nirmala UI", "OCR A Extended", "Old English Text MT",
      "Onyx", "Palace Script MT", "Palatino Linotype", "Papyrus", "Parchment", "Perpetua",
      "Perpetua Titling MT", "Playbill", "PMingLiU", "PMingLiU-ExtB", "Poor Richard", "Pristina",
      "Rage Italic", "Rockwell", "Rockwell Condensed", "Rockwell Extra Bold", "Sakkal Majalla",
      "Sanskrit Text", "Script MT", "Segoe MDL2 Assets", "Segoe Print", "Segoe Script", "Segoe UI",
      "Segoe UI Emoji", "Segoe UI Historic", "Segoe UI Symbol", "Segoe UI Variable Display",
      "Segoe UI Variable Small", "Segoe UI Variable Text", "Showcard Gothic", "SimHei",
      "Simplified Arabic", "Simplified Arabic Fixed", "SimSun", "SimSun-ExtB", "Sitka Banner",
      "Sitka Display", "Sitka Heading", "Sitka Small", "Sitka Subheading", "Sitka Text",
      "Snap ITC", "Stencil", "Sylfaen", "Symbol", "Tahoma", "Tempus Sans ITC", "Times New Roman",
      "Trebuchet MS", "Tw Cen MT", "Tw Cen MT Condensed", "Tw Cen MT Condensed Extra Bold",
      "Verdana", "Viner Hand ITC", "Vivaldi", "Vladimir Script", "Webdings", "Wide Latin",
      "Wingdings", "Wingdings 2", "Wingdings 3", "Yu Gothic", "Yu Gothic Light", "Yu Gothic Medium",
      "Yu Gothic UI", "Yu Gothic UI Light", "Yu Gothic UI Semibold", "Yu Gothic UI Semilight"
    ],
  },
  macosSafari: {
    weight: 0.25,
    uaTemplate: (v) => `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${v}.0 Safari/605.1.${Math.floor(Math.random() * 15 + 10)}`,
    versionRange: [16, 18],
    tags: ["macOS", "Safari", "Desktop"],
    platform: "MacIntel",
    vendor: "Apple Computer, Inc.",
    vendorSub: "",
    productSub: "20030107",
    appCodeName: "Mozilla",
    appName: "Netscape",
    appVersion: (v) => `5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${v}.0 Safari/605.1.15`,
    product: "Gecko",
    pdfViewerEnabled: true,
    pluginCount: 0,
    plugins: [],
    mimeTypes: [],
    screenResolutions: [[1440, 900], [1728, 1117], [2560, 1600], [1512, 982], [1920, 1080], [1680, 1050], [2560, 1440]],
    hwConcurrencyValues: [4, 8, 8, 10, 10, 12],
    deviceMemoryValues: [8, 8, 8, 16, 16, 24],
    devicePixelRatios: [1, 1, 1, 1.25, 1.5, 2, 2],
    hasUserAgentData: false,
    languages: ["en-US", "en"],
    fonts: [
      "Helvetica", "Helvetica Neue", "SF Pro Display", "SF Pro Text", "SF Mono", "SF Compact",
      "New York", "Apple Garamond", "Apple Chancery", "Apple Color Emoji", "Apple SD Gothic Neo",
      "Arial", "Arial Hebrew", "Arial Narrow", "Arial Rounded MT Bold", "Avenir", "Avenir Next",
      "Avenir Next Condensed", "Baskerville", "Big Caslon", "Bodoni 72", "Bodoni Ornaments",
      "Bradley Hand", "Brush Script MT", "Chalkboard", "Chalkboard SE", "Charter", "Cochin",
      "Comic Sans MS", "Copperplate", "Corsiva Hebrew", "Courier New", "DIN Alternate", "DIN Condensed",
      "Damascus", "Devanagari MT", "Didot", "Diwan Mishafi", "Diwan Thuluth", "Euphemia UCAS",
      "Farah", "Futura", "Galvji", "Geeza Pro", "Geneva", "Georgia", "Gill Sans", "Grantha Sangam MN",
      "Gujarati Sangam MN", "Gurmukhi MN", "Gurmukhi Sangam MN", "Hiragino Kaku Gothic ProN",
      "Hiragino Maru Gothic ProN", "Hiragino Mincho ProN", "Hiragino Sans", "Hoefler Text",
      "Impact", "InaiMathi", "ITF Devanagari", "ITF Devanagari Marathi", "Kailasa", "Kannada MN",
      "Kefa", "Khmer MN", "Kohinoor Bangla", "Kohinoor Devanagari", "Kohinoor Gujarati",
      "Kohinoor Telugu", "Kokonor", "Krungthep", "Lantinghei SC", "Lantinghei TC", "Lao MN",
      "Lucida Grande", "Luminari", "MS Gothic", "MS Mincho", "MS PMincho", "Malayalam MN",
      "Marker Felt", "Menlo", "Microsoft Sans Serif", "Monaco", "Myanmar MN", "Myanmar Sangam MN",
      "Nadeem", "Nanum Gothic", "Nanum Myeongjo", "Noto Nastaliq Urdu", "Noto Sans Bengali",
      "Noto Sans Cham", "Noto Sans Devanagari", "Noto Sans Gujarati", "Noto Sans Gurmukhi",
      "Noto Sans Kannada", "Noto Sans Khmer", "Noto Sans Lao", "Noto Sans Malayalam",
      "Noto Sans Myanmar", "Noto Sans Oriya", "Noto Sans Sinhala", "Noto Sans Tamil",
      "Noto Sans Telugu", "Noto Sans Thaana", "Noto Sans Thai", "Noto Serif Kannada",
      "Noto Serif Malayalam", "Noto Serif Tamil", "Optima", "Orator Std", "Osaka", "Palatino",
      "Papyrus", "Phosphate", "PingFang HK", "PingFang SC", "PingFang TC", "Plantagenet Cherokee",
      "PT Mono", "PT Sans", "PT Sans Caption", "PT Sans Narrow", "PT Serif", "PT Serif Caption",
      "Raanana", "Rockwell", "STFangsong", "STHeiti", "STIX Two Math", "STIX Two Text", "STKaiti",
      "STSong", "Sathu", "Savoye LET", "Seravek", "SignPainter", "Sinhala MN", "Siyam Rupali",
      "Skia", "Snell Roundhand", "Songti SC", "Songti TC", "Sukhumvit Set", "Superclarendon",
      "Symbol", "Tahoma", "Tamil MN", "Tamil Sangam MN", "Telugu MN", "Thonburi", "Times New Roman",
      "Trebuchet MS", "Verdana", "Waseem", "Webdings", "Wingdings", "Wingdings 2", "Wingdings 3",
      "Zapf Dingbats", "Zapfino"
    ],
  },
  linuxFirefox: {
    weight: 0.15,
    uaTemplate: (v) => {
      const arch = Math.random() > 0.3 ? "x86_64" : "i686";
      return `Mozilla/5.0 (X11; Linux ${arch}; rv:${v}.0) Gecko/20100101 Firefox/${v}.0`;
    },
    versionRange: [115, 136],
    tags: ["Linux", "Firefox", "Desktop"],
    platform: "Linux x86_64",
    vendor: "",
    vendorSub: "",
    productSub: "20100101",
    appCodeName: "Mozilla",
    appName: "Netscape",
    appVersion: (v) => `5.0 (X11)`,
    product: "Gecko",
    pdfViewerEnabled: true,
    pluginCount: 2,
    plugins: [
      { description: "OpenH264 Video Codec", filename: "libopenh264.so", name: "OpenH264" },
      { description: "Decrypts DRM-protected content", filename: "libwidevinecdm.so", name: "Widevine" },
    ],
    mimeTypes: [
      { description: "H.264/AVC video", suffix: "h264", type: "video/h264" },
      { description: "VP8 video", suffix: "vp8", type: "video/vp8" },
      { description: "VP9 video", suffix: "vp9", type: "video/vp9" },
      { description: "AV1 video", suffix: "av1", type: "video/av1" },
      { description: "AAC audio", suffix: "aac", type: "audio/aac" },
      { description: "MP4 audio", suffix: "mp4", type: "audio/mp4" },
      { description: "MP4 video", suffix: "mp4", type: "video/mp4" },
      { description: "WebM audio", suffix: "webm", type: "audio/webm" },
      { description: "WebM video", suffix: "webm", type: "video/webm" },
    ],
    screenResolutions: [[1920, 1080], [1366, 768], [1600, 900], [1280, 1024], [2560, 1440], [3440, 1440], [1920, 1200]],
    hwConcurrencyValues: [4, 4, 8, 8, 8, 16],
    deviceMemoryValues: [4, 8, 8, 8, 16],
    devicePixelRatios: [1, 1, 1, 1, 1.25, 1.5],
    hasUserAgentData: false,
    languages: ["en-US", "en"],
    fonts: [
      "DejaVu Sans", "DejaVu Sans Mono", "DejaVu Serif", "Liberation Sans", "Liberation Sans Narrow",
      "Liberation Serif", "Liberation Mono", "Noto Sans", "Noto Sans Arabic", "Noto Sans Armenian",
      "Noto Sans Bengali", "Noto Sans Canadian Aboriginal", "Noto Sans Cham", "Noto Sans Cherokee",
      "Noto Sans CJK JP", "Noto Sans CJK KR", "Noto Sans CJK SC", "Noto Sans CJK TC",
      "Noto Sans Devanagari", "Noto Sans Ethiopic", "Noto Sans Georgian", "Noto Sans Gujarati",
      "Noto Sans Gurmukhi", "Noto Sans Hebrew", "Noto Sans Kannada", "Noto Sans Khmer",
      "Noto Sans Lao", "Noto Sans Malayalam", "Noto Sans Myanmar", "Noto Sans Sinhala",
      "Noto Sans Tamil", "Noto Sans Telugu", "Noto Sans Thaana", "Noto Sans Thai",
      "Noto Sans Tibetan", "Noto Serif", "Noto Serif Bengali", "Noto Serif Devanagari",
      "Noto Serif Gujarati", "Noto Serif Gurmukhi", "Noto Serif Kannada", "Noto Serif Khmer",
      "Noto Serif Lao", "Noto Serif Malayalam", "Noto Serif Sinhala", "Noto Serif Tamil",
      "Noto Serif Telugu", "Noto Serif Thai", "Noto Serif Tibetan", "Noto Color Emoji",
      "Ubuntu", "Ubuntu Condensed", "Ubuntu Light", "Ubuntu Medium", "Ubuntu Mono",
      "FreeSans", "FreeSerif", "FreeMono", "Nimbus Sans", "Nimbus Roman", "Nimbus Mono",
      "Droid Sans", "Droid Serif", "Droid Sans Mono", "Cantarell", "Fira Sans", "Fira Mono",
      "Fira Code", "Source Sans Pro", "Source Serif Pro", "Source Code Pro", "Lato",
      "Open Sans", "Roboto", "Roboto Condensed", "Roboto Mono", "Roboto Slab", "Montserrat",
      "Merriweather", "Playfair Display", "PT Sans", "PT Serif", "PT Mono", "Arimo", "Tinos",
      "Cousine", "Carlito", "Caladea", "Charis SIL", "Gentium Plus", "STIX", "XITS",
      "Latin Modern Roman", "Latin Modern Sans", "Latin Modern Mono",
      "WenQuanYi Micro Hei", "WenQuanYi Zen Hei", "AR PL UMing", "Symbola",
      "Noto Emoji", "EmojiOne Color"
    ],
  },
  windowsEdge: {
    weight: 0.20,
    uaTemplate: (v) => `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.0.0 Safari/537.36 Edg/${v}.0.0.0`,
    versionRange: [118, 134],
    tags: ["Microsoft Windows", "Edge", "Desktop", "Windows 10"],
    platform: "Win32",
    vendor: "Google Inc.",
    vendorSub: "",
    productSub: "20030107",
    appCodeName: "Mozilla",
    appName: "Netscape",
    appVersion: (v) => `5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.0.0 Safari/537.36 Edg/${v}.0.0.0`,
    product: "Gecko",
    pdfViewerEnabled: true,
    pluginCount: 4,
    plugins: [
      { description: "Portable Document Format", filename: "internal-pdf-viewer", name: "PDF Viewer" },
      { description: "Portable Document Format", filename: "internal-pdf-viewer", name: "Chromium PDF Viewer" },
      { description: "Native Client Executable", filename: "internal-native-client", name: "Native Client" },
      { description: "Portable Document Format", filename: "internal-pdf-viewer", name: "WebKit built-in PDF" },
    ],
    mimeTypes: [
      { description: "Portable Document Format", suffix: "pdf", type: "application/pdf" },
      { description: "Portable Document Format", suffix: "pdf", type: "text/pdf" },
      { description: "Portable Native Client Executable", suffix: "pnacl", type: "application/pnacl" },
      { description: "Native Client Executable", suffix: "nexe", type: "application/x-nacl" },
    ],
    screenResolutions: [[1920, 1080], [1536, 864], [1366, 768], [1792, 1120], [2560, 1440], [1280, 720], [1440, 900]],
    hwConcurrencyValues: [4, 8, 8, 8, 12, 12, 16],
    deviceMemoryValues: [4, 8, 8, 8, 8, 16],
    devicePixelRatios: [1, 1, 1, 1.25, 1.25, 1.5, 2],
    hasUserAgentData: true,
    languages: ["en-US", "en"],
    fonts: null,
  },
};

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
  return pick(family.hwConcurrencyValues);
}

function randomDevicePixelRatio(family) {
  return pick(family.devicePixelRatios);
}

function randomScreen(family) {
  const [w, h] = pick(family.screenResolutions);
  return { width: w, height: h };
}

function randomDoNotTrack() {
  const r = Math.random();
  if (r < 0.7) return null;
  if (r < 0.9) return 1;
  return 0;
}

function randomConnection() {
  const r = Math.random();
  let effectiveType, rtt, downlink;
  if (r < 0.65) {
    effectiveType = "4g";
    rtt = randInt(50, 300);
    downlink = Math.round((Math.random() * 25 + 5) * 100) / 100;
  } else if (r < 0.90) {
    effectiveType = "3g";
    rtt = randInt(150, 800);
    downlink = Math.round((Math.random() * 1.5 + 0.5) * 100) / 100;
  } else if (r < 0.95) {
    effectiveType = "2g";
    rtt = randInt(1000, 3500);
    downlink = Math.round((Math.random() * 0.05 + 0.05) * 100) / 100;
  } else {
    effectiveType = "slow-2g";
    rtt = randInt(1500, 3000);
    downlink = Math.round((Math.random() * 0.03 + 0.02) * 100) / 100;
  }
  const saveData = Math.random() < 0.15;
  return { effectiveType, rtt, downlink, saveData };
}

function randomOrientation() {
  if (Math.random() < 0.9) {
    return { type: "landscape-primary", angle: 0 };
  }
  return { type: "portrait-primary", angle: 90 };
}

function randomMaxTouchPoints() {
  const r = Math.random();
  if (r < 0.80) return 0;
  if (r < 0.95) return 1;
  return randInt(2, 5);
}

function randomHeap() {
  return pick([2172649472, 2248146944, 2298478592, 4294705152, 2147483648, 3221225472, 5368709120]);
}

function randomUserAgentData(family, version) {
  if (!family.hasUserAgentData) return null;
  const majorVer = String(Math.floor(version));
  const isEdge = family === families.windowsEdge;
  const brands = [
    { brand: "Chromium", version: majorVer },
    { brand: isEdge ? "Microsoft Edge" : "Google Chrome", version: majorVer },
    { brand: "Not(A:Brand", version: "24" },
  ];
  const fullVersionList = [
    { brand: "Chromium", version: `${majorVer}.0.0.0` },
    { brand: isEdge ? "Microsoft Edge" : "Google Chrome", version: `${majorVer}.0.0.0` },
    { brand: "Not(A:Brand", version: "24.0.0.0" },
  ];
  const data = {
    brands,
    mobile: false,
    platform: family.platform,
    fullVersion: `${version}.0.0.0`,
    fullVersionList,
  };
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

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

function randomAttr(family, screen, hwConcurrency, deviceMemory, dpr, platform, ua, appVersion) {
  const v = family === families.macosSafari ? "" : "20030107";
  return {
    "navigator.vendorSub": family.vendorSub,
    "navigator.productSub": v,
    "navigator.vendor": family.vendor,
    "navigator.appCodeName": family.appCodeName,
    "navigator.appName": family.appName,
    "navigator.appVersion": appVersion,
    "navigator.platform": platform,
    "navigator.product": family.product,
    "navigator.pdfViewerEnabled": family.pdfViewerEnabled,
    "navigator.userAgent": ua,
    "screen.availHeight": screen.height - randInt(30, 60),
    "screen.availWidth": screen.width,
    "screen.width": screen.width,
    "screen.height": screen.height,
    "screen.colorDepth": 24,
    "screen.pixelDepth": 24,
    "screen.availLeft": 0,
    "screen.availTop": 0,
    "outerHeight": randInt(screen.height - 100, screen.height),
    "outerWidth": screen.width,
    "hardwareConcurrency": hwConcurrency,
    "maxTouchPoints": 0,
    "deviceMemory": deviceMemory,
    "window.devicePixelRatio": dpr,
  };
}

function pickWeightedFamily() {
  const r = Math.random();
  let cumulative = 0;
  for (const [name, family] of Object.entries(families)) {
    cumulative += family.weight;
    if (r < cumulative) return { name, family };
  }
  const entries = Object.entries(families);
  return { name: entries[entries.length - 1][0], family: entries[entries.length - 1][1] };
}

function generateVersion(family) {
  if (family.versionRange) {
    return randInt(family.versionRange[0], family.versionRange[1]);
  }
  return 120;
}

function generatePluginsForFamily(family) {
  if (family.plugins.length === 0) return [];
  const pluginRefs = [];
  const plugins = family.plugins.map((p, i) => {
    const ref = randInt(100000000, 2100000000);
    pluginRefs.push(ref);
    const mimeRefs = [];
    const filteredMimes = family.mimeTypes.filter(m => {
      if (p.name.includes("PDF") || p.name === "WebKit built-in PDF") {
        return m.type === "application/pdf" || m.type === "text/pdf";
      }
      if (p.name.includes("Native") || p.name === "Native Client") {
        return m.type === "application/pnacl" || m.type === "application/x-nacl";
      }
      if (p.name.includes("OpenH264")) {
        return m.type.includes("video/") || m.type.includes("audio/");
      }
      if (p.name.includes("Widevine")) {
        return m.type.includes("video/") || m.type.includes("audio/");
      }
      return true;
    });
    filteredMimes.forEach(m => {
      const mRef = randInt(-2100000000, 2100000000);
      mimeRefs.push(mRef);
    });
    return { ref, description: p.description, filename: p.filename, name: p.name, mimes: mimeRefs };
  });
  return plugins;
}

function generateMimesForFamily(family, plugins) {
  if (family.plugins.length === 0) return [];
  const mimes = [];
  plugins.forEach((plugin) => {
    const filteredMimes = family.mimeTypes.filter(m => {
      if (plugin.name.includes("PDF") || plugin.name === "WebKit built-in PDF") {
        return m.type === "application/pdf" || m.type === "text/pdf";
      }
      if (plugin.name.includes("Native") || plugin.name === "Native Client") {
        return m.type === "application/pnacl" || m.type === "application/x-nacl";
      }
      if (plugin.name.includes("OpenH264")) {
        return m.type.includes("video/") || m.type.includes("audio/");
      }
      if (plugin.name.includes("Widevine")) {
        return m.type.includes("video/") || m.type.includes("audio/");
      }
      return true;
    });
    filteredMimes.forEach((m, i) => {
      if (plugin.mimes && plugin.mimes[i] !== undefined) {
        mimes.push({
          ref: plugin.mimes[i],
          description: m.description,
          suffixes: m.suffix,
          type: m.type,
          plugin: plugin.ref,
        });
      }
    });
  });
  return mimes;
}

function generateHeaders(family, ua, version) {
  const headers = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent": ua,
  };
  if (family.hasUserAgentData) {
    const majorVer = String(Math.floor(version));
    headers["Sec-CH-UA"] = `"Chromium";v="${majorVer}", "Google Chrome";v="${majorVer}", "Not:A-Brand";v="24"`;
    headers["Sec-CH-UA-Mobile"] = "?0";
    headers["Sec-CH-UA-Platform"] = family.platform;
  }
  return headers;
}

function generateProfile() {
  const { name: familyName, family } = pickWeightedFamily();
  const version = generateVersion(family);
  const ua = family.uaTemplate(version);
  const screen = randomScreen(family);
  const hwConcurrency = randomHardwareConcurrency(family);
  const deviceMemory = randomDeviceMemory(family);
  const dpr = randomDevicePixelRatio(family);
  const platform = family.platform;
  const dnt = randomDoNotTrack();

  const plugins = generatePluginsForFamily(family);
  const mimes = generateMimesForFamily(family, plugins);

  const useragentdata = randomUserAgentData(family, version);

  const fonts = family.fonts
    ? (Array.isArray(family.fonts) ? family.fonts.slice() : [])
    : families.windowsChrome.fonts.slice();

  const shuffledFonts = [...fonts].sort(() => Math.random() - 0.5).slice(0, randInt(40, fonts.length));

  const connection = randomConnection();
  const orientation = randomOrientation();

  const features = familyName === "macosSafari" ? genSafariFeatures()
    : familyName === "linuxFirefox" ? genFirefoxFeatures()
    : genChromeFeatures();

  const appVersion = family.appVersion(version);
  const attr = randomAttr(family, screen, hwConcurrency, deviceMemory, dpr, platform, ua, appVersion);

  const heapValue = randomHeap();
  const maxTouchPoints = randomMaxTouchPoints();

  const lang = family.languages ? family.languages.join(",") : "en-US,en";

  const profile = {
    valid: true,
    plugins,
    mimes,
    ua,
    tags: family.tags.slice(),
    dnt: dnt,
    width: screen.width,
    height: screen.height,
    canvas: randomHash(randInt(80, 160)),
    webgl: randomHash(randInt(80, 160)),
    rectangles: [{ x: 0, y: 0, width: screen.width, height: screen.height }],
    audio: randomHash(randInt(40, 80)),
    battery: randomHash(randInt(30, 60)),
    has_battery_api: Math.random() > 0.3,
    has_battery_device: Math.random() > 0.5,
    webgl_properties: randomHash(randInt(50, 100)),
    audio_properties: randomHash(randInt(40, 80)),
    fonts: shuffledFonts,
    headers: generateHeaders(family, ua, version),
    lang,
    native_code: randomHash(randInt(20, 40)),
    css: randomHash(randInt(60, 120)),
    font_data2: randomHash(randInt(30, 60)),
    media: randomHash(randInt(40, 80)),
    speech: randomHash(randInt(30, 60)),
    bluetooth: randomHash(randInt(20, 40)),
    features,
    heap: heapValue,
    heap_correction: parseFloat((Math.random() * 0.05).toFixed(4)),
    storage: randomHash(randInt(20, 40)),
    codecs: randomHash(randInt(40, 80)),
    keyboard: randomHash(randInt(20, 40)),
    webgpu: randomHash(randInt(40, 80)),
    useragentdata,
    webrtc_codecs: randomHash(randInt(30, 60)),
    systemcolors: randomHash(randInt(20, 40)),
    systemfonts: shuffledFonts.slice(0, 20),
    customfeatures: randomHash(randInt(30, 60)),
    hls: randomHash(randInt(20, 40)),
    ChromeApp: "Enable",
    ChromeRuntime: "Disable",
    connection,
    attr,
    orientation,
    doNotTrack: dnt,
  };

  return profile;
}

function generateBatch(count) {
  const profiles = [];
  for (let i = 0; i < count; i++) {
    profiles.push(generateProfile());
  }
  return profiles;
}

function countValidFingerprints() {
  try {
    if (!fs.existsSync(FINGERPRINT_DIR)) return 0;
  } catch (e) { return 0; }
  let files;
  try {
    files = fs.readdirSync(FINGERPRINT_DIR).filter(f => f.endsWith(".fp"));
  } catch (e) { return 0; }
  
  if (files.length < 1000) return files.length;

  // Validate a random sample of 20 files. If any are corrupt, force regeneration.
  const sampleSize = Math.min(files.length, 20);
  let corruptCount = 0;
  for (let i = 0; i < sampleSize; i++) {
    const randomFile = files[Math.floor(Math.random() * files.length)];
    try {
      const fp = fs.readFileSync(path.join(FINGERPRINT_DIR, randomFile), "utf8");
      JSON.parse(fp);
    } catch (e) {
      corruptCount++;
    }
  }

  if (corruptCount > 0) {
    console.log(`[FingerprintGenerator] Detected corrupt fingerprints in sample (${corruptCount}/${sampleSize}). Forcing regeneration.`);
    return 0;
  }

  return files.length;
}

function regenerateFingerprints() {
  const validCount = countValidFingerprints();
  if (validCount >= 1000) {
    console.log(`[FingerprintGenerator] Pool already has ${validCount} valid fingerprints, skipping regeneration.`);
    return;
  }

  if (!fs.existsSync(FINGERPRINT_DIR)) {
    fs.mkdirSync(FINGERPRINT_DIR, { recursive: true });
  }

  const existingFiles = fs.readdirSync(FINGERPRINT_DIR).filter(f => f.endsWith(".fp"));
  for (const file of existingFiles) {
    fs.unlinkSync(path.join(FINGERPRINT_DIR, file));
  }

  const count = 5000;
  console.log(`[FingerprintGenerator] Generating ${count} fingerprints...`);

  const profiles = generateBatch(count);
  let written = 0;
  for (let i = 0; i < profiles.length; i++) {
    const json = JSON.stringify(profiles[i]);
    const hash = crypto.createHash("sha256").update(json).digest("hex");
    const filePath = path.join(FINGERPRINT_DIR, `${hash}.fp`);
    fs.writeFileSync(filePath, json);
    written++;
    if (written % 500 === 0) {
      console.log(`[FingerprintGenerator] Written ${written}/${count} fingerprints`);
    }
  }

  const finalValid = countValidFingerprints();
  console.log(`[FingerprintGenerator] Done. Generated ${written} files, ${finalValid} valid.`);
}

module.exports = { regenerateFingerprints, generateProfile, generateBatch };
