try {
    console.log("Checking all modified modules...");

    const channel = require("../node_modules/youtube-selfbot-api/api/functions/channel.cjs");
    console.log("SUCCESS: channel.cjs loaded");

    const search = require("../node_modules/youtube-selfbot-api/api/functions/search.cjs");
    console.log("SUCCESS: search.cjs loaded");

    const suggestions = require("../node_modules/youtube-selfbot-api/api/functions/suggestions.cjs");
    console.log("SUCCESS: suggestions.cjs loaded");

    const subscribers = require("../node_modules/youtube-selfbot-api/api/functions/subscribers.cjs");
    console.log("SUCCESS: subscribers.cjs loaded");

    console.log("SUCCESS: All modified CommonJS modules loaded successfully!");
} catch (err) {
    console.error("FAILED to load a module:", err);
    process.exit(1);
}
