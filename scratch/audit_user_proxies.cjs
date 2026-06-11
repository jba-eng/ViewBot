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

async function auditProxy(p) {
    const formatted = convertProxyFormat(p);
    const agent = new ProxyAgent(formatted);
    const sessionName = p.split('_session-')[1].split(':')[0];

    console.log(`\n--- Auditing Proxy ${sessionName} ---`);

    // 1. Mullvad exit/ASN audit
    let mullvadData;
    try {
        const mullvadRes = await axios.get("https://am.i.mullvad.net/json", {
            httpAgent: agent,
            httpsAgent: agent,
            timeout: 8000
        });
        mullvadData = mullvadRes.data;
        if (mullvadData.mullvad_exit_ip) {
            console.log(`  [FAIL] Mullvad exit node check: Detected exit node IP.`);
            return;
        }
        if (mullvadData.blacklisted && mullvadData.blacklisted.blacklisted) {
            console.log(`  [FAIL] Mullvad blacklist check: IP is blacklisted.`);
            return;
        }
        const org = mullvadData.organization ? mullvadData.organization.toLowerCase() : "";
        const badOrgs = ["amazon", "digitalocean", "linode", "google", "microsoft", "ovh", "hetzner", "leaseweb", "choopa", "m247", "host"];
        if (badOrgs.some(bad => org.includes(bad))) {
            console.log(`  [FAIL] ASN check failed: Hosting/Datacenter network (${mullvadData.organization}).`);
            return;
        }
        console.log(`  [PASS] ASN Check: ISP organization is "${mullvadData.organization}".`);
    } catch (err) {
        console.log(`  [FAIL] Mullvad ASN query failed: ${err.message}`);
        return;
    }

    // 2. Google GWS verification & CAPTCHA (sorry page) check
    try {
        const googleRes = await axios.get("https://www.google.com", {
            httpAgent: agent,
            httpsAgent: agent,
            timeout: 8000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });

        if (googleRes.status !== 200) {
            console.log(`  [FAIL] Google GWS check: status ${googleRes.status}`);
            return;
        }

        const resolvedUrl = googleRes.request && googleRes.request.res ? googleRes.request.res.responseUrl || "" : "";
        if (resolvedUrl.includes("/sorry/index") || resolvedUrl.includes("sorry.google.com")) {
            console.log(`  [FAIL] Google GWS check: CAPTCHA block detected (sorry page redirect).`);
            return;
        }

        const serverHeader = googleRes.headers["server"] || "";
        if (!serverHeader.toLowerCase().includes("gws")) {
            console.log(`  [FAIL] Google GWS signature check failed: server header is "${serverHeader}"`);
            return;
        }

        console.log(`  [PASS] Google GWS check: Connected successfully without CAPTCHA blocks.`);
    } catch (err) {
        console.log(`  [FAIL] Google GWS check failed: ${err.message}`);
        return;
    }

    // 3. YouTube connectivity check
    try {
        const ytRes = await axios.get("https://www.youtube.com", {
            httpAgent: agent,
            httpsAgent: agent,
            timeout: 8000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        });
        if (ytRes.status === 200) {
            console.log(`  [PASS] YouTube GWS check: Connected successfully.`);
        } else {
            console.log(`  [FAIL] YouTube check failed: status ${ytRes.status}`);
            return;
        }
    } catch (err) {
        console.log(`  [FAIL] YouTube check failed: ${err.message}`);
        return;
    }

    console.log(`  => PROXY AUDIT PASSED!`);
}

async function main() {
    console.log("Running verifier audits...");
    for (const p of proxies) {
        await auditProxy(p);
    }
}

main();
