const ProxyAgent = require("proxy-agent-v2");
const axios = require("axios");

const proxyUrl = "socks5h://smart-cwg5kriizi8b_area-US_life-15_session-DaMLwmlZf1e:fCSKu7GM0HtDvmEN@proxy.smartproxy.net:3120";

try {
    const agent = new ProxyAgent(proxyUrl);
    console.log("Agent created successfully!");
    axios.get("https://am.i.mullvad.net/json", {
        httpAgent: agent,
        httpsAgent: agent,
        timeout: 5000
    }).then(res => {
        console.log("Success:", res.data);
    }).catch(err => {
        console.error("Axios Error:", err.message);
        if (err.stack) console.error(err.stack);
    });
} catch (err) {
    console.error("Error creating agent:", err);
}
