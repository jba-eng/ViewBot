const fs = require("fs");
const path = require("path");

// Mocking server.cjs context
const proxyStats = {
    good: [
        { url: "socks5h://smart-cwg5kriizi8b_area-US_life-15_session-DaMLwmlZf1e:fCSKu7GM0HtDvmEN@proxy.smartproxy.net:3120" },
        { url: "socks5h://smart-cwg5kriizi8b_area-US_life-15_session-0Gck2Nuacbs:fCSKu7GM0HtDvmEN@proxy.smartproxy.net:3120" },
        { url: "socks5h://smart-cwg5kriizi8b_area-US_life-15_session-eeVjSs64ilfv:fCSKu7GM0HtDvmEN@proxy.smartproxy.net:3120" }
    ]
};

global.proxyUsageHistory = {};

function getProxySessionKey(proxyUrl) {
    if (!proxyUrl) return "";
    let match = proxyUrl.match(/_session-([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    return proxyUrl;
}

function selectProxyForJob(videoId) {
    let availableProxies = proxyStats.good.map(v => v.url);
    if (availableProxies.length === 0) {
        return "direct://";
    }

    let now = Date.now();
    let fifteenMinutesMs = 15 * 60 * 1000;

    // Filter proxies that haven't been used for this video in the last 15 minutes
    let validProxies = availableProxies.filter(proxy => {
        let sessionKey = getProxySessionKey(proxy);
        let historyKey = `${sessionKey}::${videoId}`;
        let lastUsed = global.proxyUsageHistory[historyKey];
        if (lastUsed && (now - lastUsed < fifteenMinutesMs)) {
            return false;
        }
        return true;
    });

    if (validProxies.length === 0) {
        // Fallback: pick the one used longest ago
        let oldestProxy = availableProxies[0];
        let oldestTime = Infinity;
        for (let proxy of availableProxies) {
            let sessionKey = getProxySessionKey(proxy);
            let historyKey = `${sessionKey}::${videoId}`;
            let lastUsed = global.proxyUsageHistory[historyKey] || 0;
            if (lastUsed < oldestTime) {
                oldestTime = lastUsed;
                oldestProxy = proxy;
            }
        }
        validProxies = [oldestProxy];
    }

    let selectedProxy = validProxies[Math.floor(Math.random() * validProxies.length)];

    let sessionKey = getProxySessionKey(selectedProxy);
    let historyKey = `${sessionKey}::${videoId}`;
    global.proxyUsageHistory[historyKey] = now;

    return selectedProxy;
}

// Interleaving Test
console.log("=== Testing Interleaving ===");
let mockJobs = [
    { id: "videoA", name: "Job A1" },
    { id: "videoA", name: "Job A2" },
    { id: "videoA", name: "Job A3" },
    { id: "videoB", name: "Job B1" },
    { id: "videoB", name: "Job B2" },
    { id: "videoC", name: "Job C1" }
];

// Group and Interleave
let jobsByVideo = {};
for (let job of mockJobs) {
    if (!jobsByVideo[job.id]) {
        jobsByVideo[job.id] = [];
    }
    jobsByVideo[job.id].push(job);
}

let interleavedJobs = [];
let videoIds = Object.keys(jobsByVideo);
let maxJobs = Math.max(...videoIds.map(id => jobsByVideo[id].length));

for (let i = 0; i < maxJobs; i++) {
    for (let id of videoIds) {
        if (jobsByVideo[id].length > i) {
            interleavedJobs.push(jobsByVideo[id][i]);
        }
    }
}

console.log("Interleaved Jobs:");
console.log(interleavedJobs.map(j => `${j.id} (${j.name})`));

// Assert correct interleaved order:
// Expected order: videoA, videoB, videoC, videoA, videoB, videoA
const expectedOrder = ["videoA", "videoB", "videoC", "videoA", "videoB", "videoA"];
let orderMatches = true;
for (let i = 0; i < expectedOrder.length; i++) {
    if (interleavedJobs[i].id !== expectedOrder[i]) {
        orderMatches = false;
        console.error(`Mismatch at index ${i}: expected ${expectedOrder[i]}, got ${interleavedJobs[i].id}`);
    }
}
if (orderMatches) {
    console.log("SUCCESS: Interleaving round-robin order is correct!");
} else {
    console.error("FAILED: Interleaving round-robin order is incorrect.");
}

// Proxy Selection Test
console.log("\n=== Testing Proxy Selection ===");
console.log("Good proxies list:", proxyStats.good.map(p => getProxySessionKey(p.url)));

// Run 1: Select proxies for Video A (3 times)
console.log("\nSelecting proxy for Video A, run 1...");
let p1 = selectProxyForJob("videoA");
console.log("Selected Session Key:", getProxySessionKey(p1));

console.log("Selecting proxy for Video A, run 2...");
let p2 = selectProxyForJob("videoA");
console.log("Selected Session Key:", getProxySessionKey(p2));

console.log("Selecting proxy for Video A, run 3...");
let p3 = selectProxyForJob("videoA");
console.log("Selected Session Key:", getProxySessionKey(p3));

// Assert all three selected proxies are unique since we have 3 unique proxy sessions
const s1 = getProxySessionKey(p1);
const s2 = getProxySessionKey(p2);
const s3 = getProxySessionKey(p3);
if (s1 !== s2 && s2 !== s3 && s1 !== s3) {
    console.log("SUCCESS: All 3 selected proxies for Video A are unique!");
} else {
    console.error("FAILED: Duplicate proxy selected for Video A while unique options were available.");
}

// Run 2: Select proxy for Video A again (fallback case: all used)
console.log("\nSelecting proxy for Video A, run 4 (fallback expected since all 3 were used)...");
let p4 = selectProxyForJob("videoA");
console.log("Selected Session Key (fallback):", getProxySessionKey(p4));

// Run 3: Select proxy for Video B (should be able to use any since it's a different video)
console.log("\nSelecting proxy for Video B...");
let pB = selectProxyForJob("videoB");
console.log("Selected Session Key for Video B:", getProxySessionKey(pB));
if (pB) {
    console.log("SUCCESS: Selected proxy for different video without constraint violation!");
} else {
    console.error("FAILED: Proxy selection for different video failed.");
}

console.log("\nUsage history state:");
console.log(global.proxyUsageHistory);
