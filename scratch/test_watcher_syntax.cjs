(async () => {
    try {
        console.log("Attempting to dynamically import youtube-selfbot-api...");
        const bot = await import("../node_modules/youtube-selfbot-api/index.js");
        console.log("SUCCESS: youtube-selfbot-api imported successfully without syntax errors!");
    } catch (err) {
        console.error("FAILED to import youtube-selfbot-api:", err);
    }
})();
