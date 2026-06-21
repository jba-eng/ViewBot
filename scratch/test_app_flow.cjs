const sqlite3 = require("sqlite3");
const path = require("path");

const db = new sqlite3.Database(path.join(__dirname, "../database.db3"));

function getGoodProxies() {
    return new Promise((resolve, reject) => {
        db.get("SELECT data FROM good_proxies WHERE id = 1", [], (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

async function main() {
    console.log("Reading proxies from database...");
    const row = await getGoodProxies();
    if (!row || !row.data) {
        console.log("No good proxies found in database. Exiting.");
        db.close();
        return;
    }

    const goodProxies = JSON.parse(row.data);
    if (goodProxies.length === 0) {
        console.log("Good proxies list is empty in database. Exiting.");
        db.close();
        return;
    }

    console.log(`Found ${goodProxies.length} good proxies in DB. Picking the first one:`);
    const target = goodProxies[0];
    console.log(JSON.stringify(target, null, 2));

    db.close();

    console.log("Dynamically importing youtube-selfbot-api...");
    const { selfbot } = await import("youtube-selfbot-api");

    const userDataDir = path.join(__dirname, "../cache/raw_guests/test-app-flow");
    console.log(`Using userDataDir: ${userDataDir}`);

    const bot = new selfbot({
        headless: false,
        proxy: target.url,
        proxyTimezone: target.timezone || "America/New_York",
        proxyLocale: target.locale || "en-US",
        userDataDir: userDataDir,
        timeout: 30000
    });

    console.log("Launching browser...");
    const browser = await bot.launch();
    console.log("Browser launched successfully!");

    const page = await browser.newPage();
    console.log("Page created! Navigating to YouTube...");

    try {
        await page.page.goto("https://www.youtube.com", {
            waitUntil: "commit",
            timeout: 30000
        });
        console.log("Successfully loaded YouTube homepage!");
    } catch (err) {
        console.error("Navigation failed:", err.message);
    }

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

    console.log("Browser diagnostics:");
    console.log(JSON.stringify(diag, null, 2));

    console.log("Closing browser in 5 seconds...");
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
    console.log("Done.");
}

main().catch(err => {
    console.error("Fatal error:", err);
});
