const ProxyAgent = require("proxy-agent-v2");
const axios = require("axios");

const proxyUrl = "socks5h://smart-cwg5kriizi8b_area-US_life-15_session-DaMLwmlZf1e:fCSKu7GM0HtDvmEN@proxy.smartproxy.net:3120";

(async () => {
    const agent = new ProxyAgent(proxyUrl);
    
    try {
        console.log("Requesting api64.ipify.org...");
        const res = await axios.get("https://api64.ipify.org", {
            httpAgent: agent,
            httpsAgent: agent,
            timeout: 10000
        });
        console.log("api64.ipify.org response:", res.data);
    } catch(err) {
        console.error("api64.ipify.org error:", err.message);
    }

    try {
        console.log("Requesting lumtest.com...");
        const res = await axios.get("https://lumtest.com/myip.json", {
            httpAgent: agent,
            httpsAgent: agent,
            timeout: 10000
        });
        console.log("lumtest.com response:", res.data);
    } catch(err) {
        console.error("lumtest.com error:", err.message);
    }
})();
