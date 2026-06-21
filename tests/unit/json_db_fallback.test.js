/**
 * Unit tests for json_db_fallback.cjs
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Import the module under test
const { createFallbackDB, createFallbackStore, loadDB, saveDB, ensureDir } = require('../../main/server/json_db_fallback.cjs');

let tmpDir;

beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'viewbot-test-'));
});

afterEach(() => {
    try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch (e) {
        // ignore
    }
});

describe('loadDB', () => {
    test('returns default structure for non-existent file', () => {
        const data = loadDB(path.join(tmpDir, 'nonexistent.json'));
        expect(data).toHaveProperty('views');
        expect(data).toHaveProperty('watch_time');
        expect(data).toHaveProperty('bandwidth');
        expect(data).toHaveProperty('video_cache');
        expect(data).toHaveProperty('options');
        expect(data).toHaveProperty('cache');
        expect(data).toHaveProperty('secret');
        expect(data).toHaveProperty('videos');
        expect(data).toHaveProperty('good_proxies');
        expect(data).toHaveProperty('proxies');
        expect(data).toHaveProperty('srv_password');
        expect(data).toHaveProperty('keys');
    });

    test('parses valid JSON file', () => {
        const testFile = path.join(tmpDir, 'test.json');
        fs.writeFileSync(testFile, JSON.stringify({ views: [{ date: '2024-01-01', value: 10 }], keys: [{ key: 'abc', status: 2 }] }));
        const data = loadDB(testFile);
        expect(data.views).toEqual([{ date: '2024-01-01', value: 10 }]);
        expect(data.keys).toEqual([{ key: 'abc', status: 2 }]);
    });

    test('handles invalid JSON gracefully', () => {
        const testFile = path.join(tmpDir, 'invalid.json');
        fs.writeFileSync(testFile, 'not valid json{{{');
        const data = loadDB(testFile);
        expect(data).toHaveProperty('views');
        expect(data).toHaveProperty('proxies');
    });
});

describe('saveDB', () => {
    test('writes valid JSON to file', () => {
        const testFile = path.join(tmpDir, 'save.json');
        const data = { test: 'value', nested: { a: 1 } };
        saveDB(testFile, data);
        const content = fs.readFileSync(testFile, 'utf-8');
        const parsed = JSON.parse(content);
        expect(parsed).toEqual(data);
    });

    test('creates directory if not exists', () => {
        const deepFile = path.join(tmpDir, 'deep', 'nested', 'dir', 'test.json');
        saveDB(deepFile, { test: true });
        expect(fs.existsSync(deepFile)).toBe(true);
    });
});

describe('ensureDir', () => {
    test('creates directory if not exists', () => {
        const dir = path.join(tmpDir, 'ensure-test');
        expect(fs.existsSync(dir)).toBe(false);
        ensureDir(path.join(dir, 'sub'));
        expect(fs.existsSync(dir)).toBe(true);
    });
});

describe('createFallbackDB', () => {
    let db;

    beforeEach(() => {
        db = createFallbackDB(path.join(tmpDir, 'test_db.json'));
    });

    describe('prepare().run()', () => {
        test('handles INSERT OR IGNORE INTO proxies', () => {
            const stmt = db.prepare("INSERT OR IGNORE INTO proxies (data) VALUES (?)");
            stmt.run([{ url: 'http://proxy:8080' }]);
            const result = db.get("SELECT * FROM proxies", []);
            expect(result).toBeDefined();
        });

        test('handles INSERT OR IGNORE INTO good_proxies', () => {
            const stmt = db.prepare("INSERT OR IGNORE INTO good_proxies (data) VALUES (?)");
            stmt.run([{ url: 'http://proxy:8080', latency: 100 }]);
            const result = db.get("SELECT * FROM good_proxies", []);
            expect(result).toBeDefined();
        });

        test('handles INSERT OR IGNORE INTO videos', () => {
            const stmt = db.prepare("INSERT OR IGNORE INTO videos (data) VALUES (?)");
            stmt.run([{ id: 'abc123', title: 'Test' }]);
            const result = db.get("SELECT * FROM videos", []);
            expect(result).toBeDefined();
        });

        test('handles INSERT INTO options', () => {
            const stmt = db.prepare("INSERT INTO options (id, data) VALUES (?, ?)");
            stmt.run([1, { setting: 'value' }]);
            const result = db.get("SELECT * FROM options", []);
            expect(result).toBeDefined();
        });

        test('handles UPDATE options SET data', () => {
            db.prepare("INSERT INTO options (id, data) VALUES (?, ?)").run([1, { old: 'data' }]);
            const stmt = db.prepare("UPDATE options SET data = ? WHERE id = ?");
            stmt.run([{ setting: 'updated' }], [1]);
            const result = db.get("SELECT * FROM options", []);
            expect(result.data.setting).toBe('updated');
        });

        test('handles UPDATE good_proxies SET data', () => {
            const stmt = db.prepare("UPDATE good_proxies SET data = ? WHERE id = ?");
            stmt.run([{ url: 'http://updated:8080' }], [1]);
        });

        test('handles UPDATE videos SET data', () => {
            const stmt = db.prepare("UPDATE videos SET data = ? WHERE id = ?");
            stmt.run([{ title: 'Updated' }], [1]);
        });

        test('handles INSERT OR IGNORE INTO watch_time', () => {
            const stmt = db.prepare("INSERT OR IGNORE INTO watch_time (date, value) VALUES (?, ?)");
            stmt.run(['2024-01-01', 100]);
            stmt.run(['2024-01-02', 200]);
            const stmt2 = db.prepare("SELECT * FROM watch_time");
            const results = stmt2.all();
            expect(results).toHaveLength(2);
        });

        test('handles UPDATE watch_time SET value = value + ? WHERE date = ?', () => {
            const stmt = db.prepare("INSERT OR IGNORE INTO watch_time (date, value) VALUES (?, ?)");
            stmt.run(['2024-01-01', 100]);
            const updateStmt = db.prepare("UPDATE watch_time SET value = value + ? WHERE date = ?");
            updateStmt.run([50, '2024-01-01']);
            const stmt2 = db.prepare("SELECT * FROM watch_time WHERE date = ?");
            const result = stmt2.get(['2024-01-01']);
            expect(result.value).toBe(150);
        });

        test('handles INSERT OR IGNORE INTO views', () => {
            const stmt = db.prepare("INSERT OR IGNORE INTO views (date, value) VALUES (?, ?)");
            stmt.run(['2024-01-01', 50]);
            const stmt2 = db.prepare("SELECT * FROM views");
            const results = stmt2.all();
            expect(results).toHaveLength(1);
        });

        test('handles UPDATE views SET value = value + 1', () => {
            const stmt = db.prepare("INSERT OR IGNORE INTO views (date, value) VALUES (?, ?)");
            stmt.run(['2024-01-01', 50]);
            const updateStmt = db.prepare("UPDATE views SET value = value + 1 WHERE date = ?");
            updateStmt.run(['2024-01-01']);
            const stmt2 = db.prepare("SELECT * FROM views WHERE date = ?");
            const result = stmt2.get(['2024-01-01']);
            expect(result.value).toBe(51);
        });

        test('handles INSERT OR IGNORE INTO bandwidth', () => {
            const stmt = db.prepare("INSERT OR IGNORE INTO bandwidth (date, value) VALUES (?, ?)");
            stmt.run(['2024-01-01', 1000]);
            const stmt2 = db.prepare("SELECT * FROM bandwidth");
            const results = stmt2.all();
            expect(results).toHaveLength(1);
        });

        test('handles UPDATE bandwidth SET value = value + ? WHERE date = ?', () => {
            const stmt = db.prepare("INSERT OR IGNORE INTO bandwidth (date, value) VALUES (?, ?)");
            stmt.run(['2024-01-01', 1000]);
            const updateStmt = db.prepare("UPDATE bandwidth SET value = value + ? WHERE date = ?");
            updateStmt.run([500, '2024-01-01']);
            const stmt2 = db.prepare("SELECT * FROM bandwidth WHERE date = ?");
            const result = stmt2.get(['2024-01-01']);
            expect(result.value).toBe(1500);
        });

        test('persisted data survives createFallbackDB call', () => {
            db.prepare("INSERT INTO options (id, data) VALUES (?, ?)").run([1, { key: 'value' }]);
            const db2 = createFallbackDB(path.join(tmpDir, 'test_db.json'));
            const result = db2.get("SELECT * FROM options", []);
            expect(result.data.key).toBe('value');
        });

        test('finalize callback works', () => {
            let finalized = false;
            const stmt = db.prepare("INSERT INTO options (id, data) VALUES (?, ?)");
            stmt.run([1, { test: true }], (err) => {
                finalized = true;
            });
            expect(finalized).toBe(true);
        });
    });

    describe('prepare().get()', () => {
        test('handles SELECT * FROM good_proxies', () => {
            const result = db.get("SELECT * FROM good_proxies");
            expect(result).toBeDefined();
        });

        test('handles SELECT * FROM proxies', () => {
            const result = db.get("SELECT * FROM proxies");
            expect(result).toBeDefined();
        });

        test('handles SELECT * FROM videos', () => {
            const result = db.get("SELECT * FROM videos");
            expect(result).toBeDefined();
        });

        test('handles SELECT data FROM good_proxies WHERE id = 1', () => {
            db.prepare("INSERT OR IGNORE INTO good_proxies (data) VALUES (?)").run([{ url: 'test' }]);
            const result = db.get("SELECT data FROM good_proxies WHERE id = 1");
            expect(result).toBeDefined();
        });

        test('handles SELECT status FROM keys WHERE key = ?', () => {
            db.prepare("INSERT INTO options (id, data) VALUES (?, ?)").run([1, { keys: [{ key: 'abc123', status: 2 }] }]);
            const result = db.get("SELECT status FROM keys WHERE key = ?", ['abc123']);
            expect(result.status).toBe(2);
        });

        test('handles unknown query', () => {
            const result = db.get("SELECT * FROM unknown");
            expect(result).toBeNull();
        });
    });

    describe('prepare().all()', () => {
        test('handles SELECT * FROM views', () => {
            const stmt = db.prepare("INSERT OR IGNORE INTO views (date, value) VALUES (?, ?)");
            stmt.run(['2024-01-01', 10]);
            stmt.run(['2024-01-02', 20]);
            const results = db.all("SELECT * FROM views");
            expect(Array.isArray(results)).toBe(true);
        });

        test('handles SELECT * FROM watch_time', () => {
            const results = db.all("SELECT * FROM watch_time");
            expect(Array.isArray(results)).toBe(true);
        });

        test('handles SELECT * FROM bandwidth', () => {
            const results = db.all("SELECT * FROM bandwidth");
            expect(Array.isArray(results)).toBe(true);
        });
    });
});

describe('createFallbackStore', () => {
    test('session set/get/destroy works', () => {
        // Mock session module
        const mockSession = {
            Store: class {}
        };

        const db = createFallbackDB(path.join(tmpDir, 'store_db.json'));
        const Store = createFallbackStore(mockSession, db);

        const store = new Store();

        return new Promise((resolve, reject) => {
            const sessionData = { cookie: { originalMaxAge: 3600 }, csrf: 'token123' };

            store.set('session-abc', sessionData, (err) => {
                if (err) return reject(err);

                store.get('session-abc', (err, session) => {
                    if (err) return reject(err);
                    expect(session).toEqual(sessionData);

                    store.destroy('session-abc', (err) => {
                        if (err) return reject(err);

                        store.get('session-abc', (err, session) => {
                            expect(err).toBeNull();
                            expect(session).toBeNull();
                            resolve();
                        });
                    });
                });
            });
        });
    });

    test('handles non-existent session', (done) => {
        const mockSession = { Store: class {} };
        const db = createFallbackDB(path.join(tmpDir, 'store_db2.json'));
        const Store = createFallbackStore(mockSession, db);
        const store = new Store();

        store.get('nonexistent', (err, session) => {
            expect(err).toBeNull();
            expect(session).toBeNull();
            done();
        });
    });
});
