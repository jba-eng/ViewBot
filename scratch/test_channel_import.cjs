try {
    console.log("Attempting to load channel.cjs...");
    const channelMain = require("../node_modules/youtube-selfbot-api/api/functions/channel.cjs");
    console.log("SUCCESS: channel.cjs loaded and compiled successfully!");
    
    console.log("Verifying exported main function type:", typeof channelMain);
    if (typeof channelMain === "function") {
        console.log("SUCCESS: main is a function.");
    } else {
        console.error("FAILED: main is not a function.");
    }
} catch (err) {
    console.error("FAILED to load channel.cjs:", err);
}
