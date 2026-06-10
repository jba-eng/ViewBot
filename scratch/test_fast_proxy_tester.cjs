(async () => {
    const { createProxyTester } = await import("fast-proxy-tester");
    const proxyUrl = "socks5h://smart-cwg5kriizi8b_area-US_life-15_session-DaMLwmlZf1e:fCSKu7GM0HtDvmEN@proxy.smartproxy.net:3120";
    
    const tester = new createProxyTester(proxyUrl, 5000);
    
    console.log("Testing testProxyURL on constructor:", tester.testProxyURL(proxyUrl));
    
    try {
        console.log("Testing testPrivacy...");
        const privacy = await tester.testPrivacy();
        console.log("Privacy:", privacy);
    } catch(err) {
        console.error("Privacy error:", err);
    }
    
    try {
        console.log("Testing fastTest...");
        const ft = await tester.fastTest("https://www.youtube.com");
        console.log("fastTest status:", ft.status, "latency:", ft.latency);
    } catch(err) {
        console.error("fastTest error:", err);
    }
})();
