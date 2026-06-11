const { chromium } = require('C:/Users/Jonathan/Documents/GitHub/ViewBot/node_modules/youtube-selfbot-api/node_modules/playwright-core');

async function main() {
  // --- Pick one proxy from the list (same format as the bot's proxies.txt) ---
  const rawProxy = 'proxy.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-DaMLwmlZf1e:fCSKu7GM0HtDvmEN';

  // --- Format proxy EXACTLY like youtube-selfbot-api/index.js does ---
  let formattedProxy = rawProxy;
  let protocol = 'http';
  let protParts = formattedProxy.split('://');
  if (protParts[1]) {
    formattedProxy = protParts[1];
    protocol = protParts[0];
  } else {
    formattedProxy = protParts[0];
  }
  if (!formattedProxy.includes('@')) {
    let pts = formattedProxy.split(':');
    if (pts.length === 4) {
      formattedProxy = `${protocol}://${pts[2]}:${pts[3]}@${pts[0]}:${pts[1]}`;
    }
  }
  console.log('\n=== Original proxy string ===');
  console.log(rawProxy);
  console.log('\n=== Formatted by index.js ===');
  console.log(formattedProxy);

  // --- Parse proxy for Playwright (same as browser.js setup()) ---
  const purl = new URL(formattedProxy);
  const proxyOpt = {
    server: `${purl.protocol}//${purl.hostname}:${purl.port}`,
  };
  if (purl.username) {
    proxyOpt.username = decodeURIComponent(purl.username);
    proxyOpt.password = decodeURIComponent(purl.password);
  }
  console.log('\n=== Proxy option for Playwright ===');
  console.log(JSON.stringify(proxyOpt, null, 2));

  // --- Detect actual Chrome version (same as browser.js) ---
  let chromeVer = 134;
  try {
    const exePath = chromium.executablePath();
    const out = require('child_process').execSync(`"${exePath}" --version`, { timeout: 5000, encoding: 'utf-8' });
    const m = out.match(/Chrome\/(\d+)/);
    if (m) chromeVer = parseInt(m[1], 10);
  } catch (e) {}

  // --- Generate fingerprint (same as browser.js setup()) ---
  const { FingerprintGenerator } = require('fingerprint-generator');
  const { FingerprintInjector } = require('fingerprint-injector');
  const fpGenerator = new FingerprintGenerator();
  const { fingerprint, headers } = fpGenerator.getFingerprint({
    devices: ['desktop'],
    operatingSystems: ['windows'],
    browsers: [{ name: 'chrome', minVersion: chromeVer - 2, maxVersion: chromeVer + 2 }],
  });

  console.log('\n=== Generated Fingerprint ===');
  console.log('User Agent:', fingerprint.navigator.userAgent);
  console.log('Language:', fingerprint.navigator.language);
  console.log('Screen:', fingerprint.screen?.width + 'x' + fingerprint.screen?.height || 'N/A');
  console.log('Platform:', fingerprint.navigator.platform);
  console.log('Hardware Concurrency:', fingerprint.navigator.hardwareConcurrency);
  console.log('Device Memory:', fingerprint.navigator.deviceMemory);
  console.log('WebGL Vendor:', fingerprint.webgl?.vendor);
  console.log('WebGL Renderer:', fingerprint.webgl?.renderer);

  const fpLocale = (fingerprint.navigator?.language || 'en-US').split(',')[0].trim();
  const fpScreen = fingerprint.screen || {};
  const initW = fpScreen.width || 1366;
  const initH = fpScreen.height || 768;

  const args = [
    `--window-size=${initW + 16},${initH + 88}`,
    '--force-webrtc-ip-handling-policy=disable-non-proxied-udp',
    '--mute-audio',
  ];
  if (fingerprint.navigator.userAgent) {
    args.push(`--user-agent=${fingerprint.navigator.userAgent}`);
  }

  console.log('\n=== Chrome CLI args ===');
  args.forEach(a => console.log(' ', a));

  // --- Launch browser with persistent context (same as browser.js) ---
  const userDataDir = 'C:/Users/Jonathan/AppData/Local/Temp/opencode/test-fp-proxy-' + Date.now();
  require('fs').mkdirSync(userDataDir, { recursive: true });

  const contextOpts = {
    headless: false,
    viewport: null,
    locale: fpLocale,
    proxy: proxyOpt,
    args,
  };

  console.log('\n=== Launching browser... ===');
  const browser = await chromium.launchPersistentContext(userDataDir, contextOpts);

  // --- Inject fingerprint (same as browser.js) ---
  const injector = new FingerprintInjector();
  await injector.attachFingerprintToPlaywright(browser, { fingerprint, headers }).catch(e => {
    console.warn('Fingerprint injection failed (non-fatal):', e.message);
  });

  // --- Navigate to a diagnostic page ---
  const page = browser.pages()[0] || await browser.newPage();
  await page.goto('https://www.whatismybrowser.com/detect/what-is-my-user-agent/', {
    waitUntil: 'domcontentloaded',
  });

  // --- Gather diagnostics from the page ---
  const diag = await page.evaluate(() => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      screenWidth: screen.width,
      screenHeight: screen.height,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
    };
  });

  console.log('\n=== Browser Diagnostics ===');
  console.log(JSON.stringify(diag, null, 2));

  // --- Also take a screenshot of the whatismybrowser page ---
  await page.screenshot({ path: 'C:/Users/Jonathan/AppData/Local/Temp/opencode/whatismybrowser.png', fullPage: true });

  // --- Check IP via a simple endpoint ---
  try {
    const ipResp = await page.evaluate(async () => {
      const r = await fetch('https://httpbin.org/ip');
      return r.json();
    });
    console.log('\n=== Proxy IP Check ===');
    console.log(JSON.stringify(ipResp, null, 2));
    console.log('If "origin" shows a Smartproxy IP, proxy is working!');
  } catch (e) {
    console.log('IP check failed:', e.message);
  }

  // --- WebRTC leak check ---
  try {
    const webrtcResult = await page.evaluate(async () => {
      return new Promise((resolve) => {
        try {
          const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
          pc.createDataChannel('test');
          pc.createOffer().then(offer => pc.setLocalDescription(offer));
          const candidates = [];
          pc.onicecandidate = (e) => {
            if (e.candidate) {
              candidates.push(e.candidate.candidate);
            } else {
              resolve(candidates);
            }
          };
          setTimeout(() => resolve(candidates), 5000);
        } catch (e) {
          resolve('WebRTC blocked or not available: ' + e.message);
        }
      });
    });
    console.log('\n=== WebRTC Candidates ===');
    console.log(webrtcResult);
    const hasLocalIP = JSON.stringify(webrtcResult).match(/\b(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|127\.0\.0\.1|0\.0\.0\.0)\b/);
    if (hasLocalIP) {
      console.log('WARNING: Local IP detected in WebRTC candidates! Leak.');
    } else {
      console.log('OK: No local IP in WebRTC candidates.');
    }
  } catch (e) {
    console.log('WebRTC check failed:', e.message);
  }

  // --- Canvas fingerprint check ---
  try {
    const canvasFP = await page.evaluate(() => {
      const c = document.createElement('canvas');
      c.width = 200; c.height = 50;
      const ctx = c.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Cwm fjordbank glyphs vext quiz, 😃', 2, 15);
      return c.toDataURL();
    });
    console.log('\n=== Canvas Fingerprint (first 80 chars) ===');
    console.log(canvasFP.substring(0, 80) + '...');
    console.log('length:', canvasFP.length);
    console.log('(Compare with/without injection to verify spoofing)');
  } catch (e) {
    console.log('Canvas check failed:', e.message);
  }

  // Cleanup
  console.log('\n=== Cleaning up ===');
  await browser.close();
  require('fs').rmSync(userDataDir, { recursive: true, force: true });
  console.log('Done. Screenshot saved to temp/whatismybrowser.png');
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
