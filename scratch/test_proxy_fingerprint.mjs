import { selfbot } from "file:///c:/Users/Jonathan/Documents/GitHub/ViewBot/node_modules/youtube-selfbot-api/index.js";
import path from "path";
import fs from "fs";

function convertProxyFormat(proxyString) {
    if (!proxyString) return proxyString;
    let protocol = "http";
    let workingString = proxyString;
    if (proxyString.includes("://")) {
        let protocolParts = proxyString.split("://");
        protocol = protocolParts[0];
        workingString = protocolParts[1];
    }
    let parts = workingString.split(":");
    if (parts.length === 4) {
        return `${protocol}://${parts[2]}:${parts[3]}@${parts[0]}:${parts[1]}`;
    }
    return proxyString;
}

function injectStickySession(proxyUrl) {
    if (!proxyUrl || proxyUrl === "direct" || proxyUrl === "direct://") return proxyUrl;
    let converted = convertProxyFormat(proxyUrl);
    try {
        let url = new URL(converted);
        if (url.username) {
            const sessionId = Math.random().toString(36).substring(2, 12);
            if (!url.username.includes("_session-")) {
                url.username = `${url.username}_session-${sessionId}`;
            } else {
                url.username = url.username.replace(/_session-[a-zA-Z0-9_-]+/g, `_session-${sessionId}`);
            }
        }
        return url.toString();
    } catch (err) {
        const sessionId = Math.random().toString(36).substring(2, 12);
        if (converted.includes("@")) {
            const parts = converted.split("@");
            const userPassPart = parts[0];
            if (!userPassPart.includes("_session-")) {
                return `${userPassPart}_session-${sessionId}@${parts[1]}`;
            } else {
                return `${userPassPart.replace(/_session-[a-zA-Z0-9_-]+/g, `_session-${sessionId}`)}@${parts[1]}`;
            }
        }
        return proxyUrl;
    }
}

// You can swap this with any of your proxies to test
const rawProxy = "socks5://proxy.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-5_session-MTXlX9QO9:fCSKu7GM0HtDvmEN";
const stickiedProxy = injectStickySession(rawProxy);

console.log("==========================================");
console.log("Original Proxy URL:", rawProxy);
console.log("Sticky/Randomized Session Proxy URL:", stickiedProxy);
console.log("==========================================\n");

(async () => {
    try {
        console.log("Launching selfbot browser with proxy and randomized fingerprint...");
        let bot = new selfbot({
            headless: false,
            muteAudio: true,
            proxy: stickiedProxy,
            fingerprint: {
                viewport: {
                    width: 1280,
                    height: 720,
                    deviceScaleFactor: 1,
                    isMobile: false
                }
            }
        });
        
        let browser = await bot.launch();
        console.log("Browser launched successfully!");
        
        let pages = browser.context.pages();
        let page = pages[0] || await browser.context.newPage();
        
        console.log("Navigating to ipinfo.io to check IP and geolocation...");
        await page.goto("https://ipinfo.io/json", { timeout: 30000, waitUntil: "domcontentloaded" });
        
        const ipInfoText = await page.evaluate(() => document.body.innerText);
        let ipParsed = {};
        try {
            ipParsed = JSON.parse(ipInfoText);
        } catch(e) {}
        
        // Navigate to a blank page to test client side features
        await page.goto("about:blank");
        
        const clientFingerprint = await page.evaluate(() => {
            let webglInfo = { vendor: "N/A", renderer: "N/A" };
            try {
                const canvas = document.createElement("canvas");
                const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
                if (gl) {
                    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
                    if (debugInfo) {
                        webglInfo.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                        webglInfo.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    }
                }
            } catch(e) {}

            return {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                languages: navigator.languages,
                hardwareConcurrency: navigator.hardwareConcurrency,
                devicePixelRatio: window.devicePixelRatio,
                screenResolution: `${screen.width}x${screen.height}`,
                viewportSize: `${window.innerWidth}x${window.innerHeight}`,
                webglVendor: webglInfo.vendor,
                webglRenderer: webglInfo.renderer
            };
        });

        console.log("\n==========================================");
        console.log("1. OUTBOUND NETWORK INFO (What Google sees as the IP)");
        console.log("==========================================");
        console.log(`IP Address : ${ipParsed.ip || "N/A"}`);
        console.log(`ISP/ASN    : ${ipParsed.org || "N/A"}`);
        console.log(`City/Region: ${ipParsed.city || "N/A"}, ${ipParsed.region || "N/A"}`);
        console.log(`Country    : ${ipParsed.country || "N/A"}`);
        console.log(`Timezone   : ${ipParsed.timezone || "N/A"}`);

        console.log("\n==========================================");
        console.log("2. CLIENT FINGERPRINT INFO (What Google sees as the Browser)");
        console.log("==========================================");
        console.log(`User-Agent   : ${clientFingerprint.userAgent}`);
        console.log(`Platform     : ${clientFingerprint.platform}`);
        console.log(`Languages    : ${clientFingerprint.languages.join(", ")}`);
        console.log(`CPU Cores    : ${clientFingerprint.hardwareConcurrency}`);
        console.log(`Resolution   : ${clientFingerprint.screenResolution}`);
        console.log(`Viewport     : ${clientFingerprint.viewportSize}`);
        console.log(`Device Pixel : ${clientFingerprint.devicePixelRatio}`);
        console.log(`WebGL Vendor : ${clientFingerprint.webglVendor}`);
        console.log(`WebGL Render : ${clientFingerprint.webglRenderer}`);
        console.log("==========================================\n");
        
        console.log("Waiting 10 seconds before closing...");
        await new Promise(r => setTimeout(r, 10000));
        
        await browser.close();
        console.log("Browser closed.");
    } catch (err) {
        console.error("Error occurred during test:", err);
    }
})();
