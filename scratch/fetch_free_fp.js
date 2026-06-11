import { plugin } from 'playwright-with-fingerprints';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

plugin.setWorkingFolder(path.resolve(__dirname, '../browserEngine'));
plugin.setServiceKey('');

async function run() {
    console.log("Fetching a free Chrome fingerprint...");
    try {
        const fingerprint = await plugin.fetch({
            tags: ['Microsoft Windows', 'Chrome'],
        });
        const hash = crypto.createHash('sha256').update(fingerprint).digest('hex');
        const folder = path.resolve(__dirname, '../node_modules/youtube-selfbot-api/fingerprints');
        fs.mkdirSync(folder, { recursive: true });
        const filePath = path.join(folder, `${hash}.fp`);
        fs.writeFileSync(filePath, fingerprint);
        console.log(`Successfully fetched and saved fingerprint to ${filePath}`);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

run();
