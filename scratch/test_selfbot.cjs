const path = require("path");

async function main() {
    console.log("Dynamically importing youtube-selfbot-api...");
    const { selfbot } = await import("youtube-selfbot-api");

    console.log("Launching selfbot with Europe/Berlin and de-DE...");
    const bot = new selfbot({
        headless: true,
        proxy: "direct://",
        proxyTimezone: "Europe/Berlin",
        proxyLocale: "de-DE",
        userDataDir: path.join(__dirname, "../cache/raw_guests/test-bot")
    });

    const browser = await bot.launch();
    console.log("Browser launched successfully!");

    const page = await browser.newPage();
    console.log("Page created!");

    const diag = await page.page.evaluate(() => {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            languages: navigator.languages,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            webdriver: navigator.webdriver
        };
    });

    console.log("Diagnostics from inside browser:");
    console.log(JSON.stringify(diag, null, 2));

    await browser.close();
    console.log("Test finished!");
}

main().catch(err => {
    console.error("Test failed:", err);
});
