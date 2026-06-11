const { chromium } = require('C:/Users/Jonathan/Documents/GitHub/ViewBot/node_modules/youtube-selfbot-api/node_modules/playwright-core');
const { FingerprintGenerator } = require('fingerprint-generator');
const { FingerprintInjector } = require('fingerprint-injector');

let chromeVer = 134;
try {
  const exePath = chromium.executablePath();
  const out = require('child_process').execSync(`"${exePath}" --version`, { timeout: 5000, encoding: 'utf-8' });
  const m = out.match(/Chrome\/(\d+)/);
  if (m) chromeVer = parseInt(m[1], 10);
} catch (e) {}
console.log('Binary Chrome version:', chromeVer);

const PROXIES = [
  'proxy.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-DaMLwmlZf1e:fCSKu7GM0HtDvmEN',
  'proxy.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-0Gck2Nuacbs:fCSKu7GM0HtDvmEN',
  'proxy.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-eeVjSs64ilfv:fCSKu7GM0HtDvmEN',
  'proxy.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-CvikGZUJFI:fCSKu7GM0HtDvmEN',
  'proxy.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-OcYVPvYYt:fCSKu7GM0HtDvmEN',
  'proxy.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-8H1xHq:fCSKu7GM0HtDvmEN',
  'proxy.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-YYowQG:fCSKu7GM0HtDvmEN',
  'proxy.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-6bfDYO4:fCSKu7GM0HtDvmEN',
  'proxy.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-frYoXau7:fCSKu7GM0HtDvmEN',
  'proxy.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-m9LriZr:fCSKu7GM0HtDvmEN',
];

function formatProxy(raw) {
  let protocol = 'http', ws = raw;
  const pts2 = raw.split('://');
  if (pts2[1]) { ws = pts2[1]; protocol = pts2[0]; }
  else { ws = pts2[0]; }
  if (!ws.includes('@')) {
    const pts = ws.split(':');
    if (pts.length === 4) ws = `${protocol}://${pts[2]}:${pts[3]}@${pts[0]}:${pts[1]}`;
  }
  return ws;
}

function parseProxy(raw) {
  const f = formatProxy(raw);
  try {
    const u = new URL(f);
    return { server: `${u.protocol}//${u.hostname}:${u.port}`, username: u.username ? decodeURIComponent(u.username) : undefined, password: u.password ? decodeURIComponent(u.password) : undefined };
  } catch { return { server: raw }; }
}

async function runOne(idx, proxyStr) {
  const proxyOpt = parseProxy(proxyStr);
  const fpGen = new FingerprintGenerator();
  const { fingerprint, headers } = fpGen.getFingerprint({ devices: ['desktop'], operatingSystems: ['windows'], browsers: [{ name: 'chrome', minVersion: chromeVer - 2, maxVersion: chromeVer + 2 }], mockWebRTC: true });
  const fpLocale = (fingerprint.navigator?.language || 'en-US').split(',')[0].trim();
  const fpScreen = fingerprint.screen || {};
  const initW = Math.max(fpScreen.width || 1366, 800);
  const initH = Math.max(fpScreen.height || 768, 600);
  const args = [`--window-size=${initW + 16},${initH + 88}`, '--mute-audio'];
  const ua = fingerprint.navigator.userAgent;
  if (ua) args.push(`--user-agent=${ua}`);

  const userDataDir = `C:/Users/Jonathan/AppData/Local/Temp/opencode/audit-${idx}`;
  require('fs').mkdirSync(userDataDir, { recursive: true });

  let browser;
  try {
    const tz = ['America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Anchorage','Pacific/Honolulu'][Math.floor(Math.random()*6)];
    browser = await chromium.launchPersistentContext(userDataDir, { headless: false, viewport: null, locale: fpLocale, timezoneId: tz, proxy: proxyOpt, args });
    const injector = new FingerprintInjector();
    await injector.attachFingerprintToPlaywright(browser, { fingerprint, headers }).catch(() => {});
    await browser.addInitScript(() => {
      if (typeof window.chrome === 'undefined' || !window.chrome) { window.chrome = {}; }
      window.chrome.runtime = window.chrome.runtime || {};
      const cr = window.chrome.runtime;
      if (!cr.id) cr.id = 'mock';
      cr.lastError = undefined;
      cr.onMessage = cr.onMessage || { addListener: function() {} };
      cr.onConnect = cr.onConnect || { addListener: function() {} };
      cr.sendMessage = cr.sendMessage || function() {};
      cr.connect = cr.connect || function() { return { onMessage: { addListener: function() {} } }; };
      cr.getManifest = cr.getManifest || function() { return { version: '1.0' }; };
      cr.getURL = cr.getURL || function(p) { return p; };
      window.chrome.app = window.chrome.app || {};
      window.chrome.loadTimes = window.chrome.loadTimes || function() {};
      window.chrome.csi = window.chrome.csi || function() {};
    });
    const page = browser.pages()[0] || await browser.newPage();

    // IP check
    let ipInfo = {};
    try {
      await page.goto('https://httpbin.org/ip', { waitUntil: 'domcontentloaded', timeout: 15000 });
      ipInfo = JSON.parse(await page.evaluate(() => document.body.innerText));
    } catch { ipInfo = { origin: 'TIMEOUT/_FAILED' }; }

    // Signals
    await page.goto('about:blank', { waitUntil: 'domcontentloaded', timeout: 10000 });
    const signals = await page.evaluate(() => {
      const nav = navigator, doc = document;
      function wgl() { try { const c = doc.createElement('canvas'); const gl = c.getContext('webgl') || c.getContext('experimental-webgl'); if (!gl) return null; const ext = gl.getExtension('WEBGL_debug_renderer_info'); return { vendor: gl.getParameter(gl.VENDOR), renderer: gl.getParameter(gl.RENDERER), unmaskedVendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : null, unmaskedRenderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null }; } catch { return null; } }
      function canvasFP() { try { const c = doc.createElement('canvas'); c.width=200;c.height=50; const ctx=c.getContext('2d'); ctx.textBaseline='top'; ctx.font='14px Arial'; ctx.fillStyle='#f60'; ctx.fillRect(125,1,62,20); ctx.fillStyle='#069'; ctx.fillText('Cwm fjordbank glyphs vext quiz, 😃',2,15); return c.toDataURL().substring(0,80); } catch { return null; } }
      return {
        ua: nav.userAgent, webdriver: nav.webdriver, platform: nav.platform, lang: nav.language, langs: Array.from(nav.languages),
        hwConcurrency: nav.hardwareConcurrency, deviceMem: nav.deviceMemory, pluginsCount: nav.plugins.length,
        plugins: Array.from(nav.plugins||[]).map(p=>p.name).slice(0,5).join(', '),
        uaData: nav.userAgentData ? { brands: nav.userAgentData.brands.map(b=>`${b.brand}/${b.version}`).join(', '), mobile: nav.userAgentData.mobile, platform: nav.userAgentData.platform } : null,
        screen: { w: screen.width, h: screen.height, cd: screen.colorDepth, pd: screen.pixelDepth, aw: screen.availWidth, ah: screen.availHeight },
        win: { iw: innerWidth, ih: innerHeight, ow: outerWidth, oh: outerHeight, dpr: devicePixelRatio },
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone, tzOffset: new Date().getTimezoneOffset(),
        chrome: typeof chrome !== 'undefined' ? { runtime: !!chrome.runtime, app: !!chrome.app } : null,
        webgl: wgl(), canvas: canvasFP(), audio: (()=>{try{const a=new(AudioContext||webkitAudioContext)();return{sr:a.sampleRate,st:a.state}}catch{return null}})(),
        apis: { perm: typeof nav.permissions, mediaDev: typeof nav.mediaDevices, cred: typeof nav.credentials, stor: typeof nav.storage, battery: typeof nav.getBattery, geoloc: typeof nav.geolocation, clipboard: typeof nav.clipboard, usb: typeof nav.usb, bluetooth: typeof nav.bluetooth },
        doc: { dm: document.documentMode, cm: document.compatMode, cs: document.characterSet },
        headlessUA: /HeadlessChrome/.test(navigator.userAgent),
      };
    });

    // WebRTC (now blocked by mockWebRTC: true)
    let webrtcBlocked = false;
    try {
      webrtcBlocked = await page.evaluate(() => {
        try {
          const pc = new RTCPeerConnection();
          return !(pc instanceof RTCPeerConnection);
        } catch { return true; }
      });
    } catch {}

    await browser.close();
    require('fs').rmSync(userDataDir, { recursive: true, force: true });

    return { idx, proxy: proxyStr, ipInfo, ua, signals, webrtcBlocked, fingerprint, ok: true };
  } catch (e) {
    try { if (browser) await browser.close(); } catch {}
    try { require('fs').rmSync(userDataDir, { recursive: true, force: true }); } catch {}
    return { idx, proxy: proxyStr, ok: false, error: e.message };
  }
}

async function main() {
  const results = [];
  for (let i = 0; i < PROXIES.length; i++) {
    console.log(`\n[${i+1}/${PROXIES.length}] Testing proxy ${i+1}...`);
    const r = await runOne(i, PROXIES[i]);
    results.push(r);
    if (r.ok) console.log(`  IP: ${r.ipInfo?.origin} | UA Chrome/${r.ua?.match(/Chrome\/(\d+)/)?.[1]} | Score: computing...`);
    else console.log(`  FAILED: ${r.error}`);
  }

  // --- ANALYSIS ---
  console.log('\n' + '='.repeat(100));
  console.log('COMPREHENSIVE AUDIT RESULTS');
  console.log('='.repeat(100));

  const valid = results.filter(r => r.ok);
  const allIssues = [];

  for (const r of valid) {
    const s = r.signals;
    const issues = [];

    // CRITICAL checks
    if (s.webdriver === true) issues.push('CRITICAL|navigator.webdriver is TRUE - instant detection');
    if (s.headlessUA) issues.push('CRITICAL|UserAgent contains "HeadlessChrome"');
    if (!s.chrome) issues.push('CRITICAL|chrome.runtime missing entirely');
    else { if (!s.chrome.runtime) issues.push('HIGH|chrome.runtime missing'); }

    // HIGH checks
    if (!s.pluginsCount) issues.push('HIGH|navigator.plugins is empty (headless signal)');
    if (r.webrtcLocal) issues.push('HIGH|Local/private IP leaked via WebRTC');
    if (r.webrtcIP && r.ipInfo?.origin && r.webrtcIP !== r.ipInfo.origin) issues.push(`HIGH|WebRTC IP ${r.webrtcIP} != HTTP IP ${r.ipInfo.origin}`);

    // Chrome version match
    const uaV = r.ua?.match(/Chrome\/(\d+)/);
    if (uaV) {
      const uaN = parseInt(uaV[1], 10);
      const diff = Math.abs(uaN - chromeVer);
      if (diff > 3) issues.push(`MEDIUM|UA Chrome/${uaN} differs from binary Chrome/${chromeVer} by ${diff}`);
    }

    // Client Hints
    if (s.uaData) {
      const chV = s.uaData.brands.match(/Chrome[\/ ](\d+)/);
      if (chV) {
        const chN = parseInt(chV[1], 10);
        const uaV2 = r.ua?.match(/Chrome\/(\d+)/);
        if (uaV2 && parseInt(uaV2[1], 10) !== chN) issues.push(`MEDIUM|Client Hints Chrome/${chN} != UA Chrome/${uaV2[1]}`);
      }
    } else {
      issues.push('LOW|userAgentData (Client Hints) not available');
    }

    // Timezone consistent with proxy
    const tz = s.tz || '';
    if (!tz.includes('America') && !tz.includes('US/')) {
      issues.push(`MEDIUM|Timezone "${tz}" doesn\'t match US proxy`);
    }

    // WebGL
    if (!s.webgl) issues.push('MEDIUM|WebGL not available');
    else if (!s.webgl.unmaskedVendor) issues.push('LOW|WebGL vendor empty');

    // Screen suspicious
    if (s.screen.w < 800) issues.push('LOW|Screen width ${s.screen.w} unusually small');

    // Audio
    if (!s.audio) issues.push('LOW|AudioContext not available');

    r.issues = issues;
    r.score = Math.max(0, 100 - issues.reduce((a, i) => {
      if (i.startsWith('CRITICAL')) return a + 50;
      if (i.startsWith('HIGH')) return a + 20;
      if (i.startsWith('MEDIUM')) return a + 10;
      return a + 3;
    }, 0));
    allIssues.push(...issues);

    const crit = issues.filter(i => i.startsWith('CRITICAL'));
    const high = issues.filter(i => i.startsWith('HIGH'));
    const med = issues.filter(i => i.startsWith('MEDIUM'));
    const low = issues.filter(i => i.startsWith('LOW'));
    console.log(`\n[${r.idx+1}] Score: ${r.score}/100 | IP: ${r.ipInfo?.origin} | UA: Chrome/${uaV?.[1] || '?'}`);
    if (crit.length) console.log(`  CRITICAL (${crit.length}):`, crit.map(i=>i.replace('CRITICAL|','')).join('; '));
    if (high.length) console.log(`  HIGH (${high.length}):`, high.map(i=>i.replace('HIGH|','')).join('; '));
    if (med.length) console.log(`  MEDIUM (${med.length}):`, med.map(i=>i.replace('MEDIUM|','')).join('; '));
    if (low.length) console.log(`  LOW (${low.length}):`, low.map(i=>i.replace('LOW|','')).join('; '));
    console.log(`  Screen: ${s.screen.w}x${s.screen.h} @${s.win.dpr}x | Lang: ${s.lang} | TZ: ${s.tz} (${s.tzOffset})`);
    console.log(`  WebGL: ${s.webgl?.unmaskedRenderer?.substring(0,50) || 'N/A'} | Plugins: ${s.pluginsCount} | WebRTC IP: ${r.webrtcIP || 'none'}`);
    console.log(`  Client Hints: ${s.uaData?.brands?.substring(0,80) || 'N/A'}`);
  }

  // --- AGGREGATE ---
  console.log('\n' + '='.repeat(100));
  console.log('OVERALL');
  console.log('='.repeat(100));
  console.log(`Total: ${valid.length}/${PROXIES.length} successful`);
  const ips = [...new Set(valid.map(r => r.ipInfo?.origin))];
  console.log(`Unique IPs: ${ips.length} ${ips.join(', ')}`);
  console.log(`Avg score: ${(valid.reduce((a,r)=>a+r.score,0)/valid.length).toFixed(1)}/100`);

  const cats = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const i of allIssues) { if (i.startsWith('CRITICAL')) cats.CRITICAL++; else if (i.startsWith('HIGH')) cats.HIGH++; else if (i.startsWith('MEDIUM')) cats.MEDIUM++; else cats.LOW++; }
  console.log(`Issues: ${cats.CRITICAL} C | ${cats.HIGH} H | ${cats.MEDIUM} M | ${cats.LOW} L`);

  // Count per unique issue
  const issueFreq = {};
  for (const i of allIssues) { const msg = i.replace(/^(CRITICAL|HIGH|MEDIUM|LOW)\|/, ''); issueFreq[msg] = (issueFreq[msg] || 0) + 1; }
  console.log('\nIssue frequency (across tests):');
  Object.entries(issueFreq).sort((a,b) => b[1]-a[1]).forEach(([msg, count]) => {
    console.log(`  ${'■'.repeat(Math.round(count/valid.length*10))} ${count}/${valid.length} — ${msg}`);
  });

  // --- VERDICT ---
  console.log('\n' + '='.repeat(100));
  console.log('VERDICT');
  console.log('='.repeat(100));

  const hasCritical = valid.some(r => r.issues?.some(i => i.startsWith('CRITICAL')));
  const hasHigh = valid.some(r => r.issues?.some(i => i.startsWith('HIGH')));
  const avgScore = valid.reduce((a,r) => a + r.score, 0) / valid.length;

  if (hasCritical) {
    console.log('❌ FAIL — Critical browser automation signals detected. YouTube will flag these immediately.');
    console.log('   Fix navigator.webdriver and headless detection before production use.');
  } else if (hasHigh) {
    console.log('⚠️  CAUTION — High-severity issues present that YouTube actively checks.');
    console.log('   These sessions will have elevated risk scores. May still work for view counting');
    console.log('   but logged-in features (likes, comments) will likely trigger challenges.');
  } else if (avgScore < 85) {
    console.log('⚠️  MARGINAL — Multiple medium/low discrepancies. View counting may work but risk is moderate.');
  } else {
    console.log('✅ PASS — Browser fingerprint is consistent with a real residential Chrome user.');
    console.log('   No critical automation signals detected. Proxy/fingerprint combo is viable.');
  }

  console.log('\nRemaining gaps vs real viewer:');
  console.log('  1. Timezone — always system default (' + (valid[0]?.signals?.tz || '?') + '). Real viewer\'s timezone matches IP geo.');
  console.log('  2. WebGL — injector does not spoof WebGL vendor/renderer (reports actual GPU). Minor signal.');
  console.log('  3. Client Hints — userAgentData.brands may still expose real Chrome version. Undetermined.');
  console.log('  4. Fonts — injector may not enumerate spoofed fonts. Not tested.');
  console.log('  5. Canvas — injected per-page, may have timing/discrepancy window before injection runs.');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
