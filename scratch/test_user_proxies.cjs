const axios = require('axios');
const ProxyAgent = require('proxy-agent-v2');

const proxies = [
  'us.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-iKE0f0MMY:fCSKu7GM0HtDvmEN',
  'us.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-R8btmHZ8:fCSKu7GM0HtDvmEN',
  'us.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-foqkVffgaMA6:fCSKu7GM0HtDvmEN',
  'us.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-DGbmZqi6E:fCSKu7GM0HtDvmEN',
  'us.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-wuQ1Cfk:fCSKu7GM0HtDvmEN',
  'us.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-pGjuTSB:fCSKu7GM0HtDvmEN',
  'us.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-KPF6ygd8e:fCSKu7GM0HtDvmEN',
  'us.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-3vbyNAbBVc:fCSKu7GM0HtDvmEN',
  'us.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-3uRbKFFP2:fCSKu7GM0HtDvmEN',
  'us.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-jQsvxaQC:fCSKu7GM0HtDvmEN',
  'us.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-muz9r9YjAxBN:fCSKu7GM0HtDvmEN',
  'us.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-f2estvEcyc1Z:fCSKu7GM0HtDvmEN',
  'us.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-fFtXYcRwiyD:fCSKu7GM0HtDvmEN',
  'us.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-FRRPHzS70y:fCSKu7GM0HtDvmEN',
  'us.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-aZIRB02:fCSKu7GM0HtDvmEN',
  'us.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-2d6oK9Ob:fCSKu7GM0HtDvmEN',
  'us.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-Zh35nfO:fCSKu7GM0HtDvmEN',
  'us.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-CD0mEB7yZ:fCSKu7GM0HtDvmEN',
  'us.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-Ji0Q1YB:fCSKu7GM0HtDvmEN',
  'us.smartproxy.net:3120:smart-cwg5kriizi8b_area-US_life-15_session-mVa9yXSo5:fCSKu7GM0HtDvmEN'
];

function convertProxyFormat(proxyString) {
    let parts = proxyString.split(":");
    if (parts.length === 4) {
        return `http://${parts[2]}:${parts[3]}@${parts[0]}:${parts[1]}`;
    }
    return proxyString;
}

async function test(p) {
    const formatted = convertProxyFormat(p);
    const agent = new ProxyAgent(formatted);
    const start = Date.now();
    try {
        const res = await axios.get("https://www.google.com", {
            httpAgent: agent,
            httpsAgent: agent,
            timeout: 10000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        });
        const latency = Date.now() - start;
        console.log(`[PASS] ${p.split('_session-')[1].split(':')[0]} - Latency: ${latency}ms - Status: ${res.status}`);
    } catch (err) {
        console.log(`[FAIL] ${p.split('_session-')[1].split(':')[0]} - Error: ${err.message}`);
    }
}

async function main() {
    console.log("Testing proxies...");
    for (const p of proxies) {
        await test(p);
    }
}

main();
