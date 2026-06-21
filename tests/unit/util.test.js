/**
 * Unit tests for random() and clamp() utilities
 */

// random() from init_start.cjs
function random(min, max) {
    if (max) {
        return min + Math.floor(Math.random() * (max - min));
    } else {
        if (typeof min === "object") {
            return min[random(min.length)];
        } else {
            return Math.floor(Math.random() * min);
        }
    }
}

// clamp() from startWorker.cjs and generate_jobs.cjs
function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
}

describe('clamp', () => {
    test('returns number when within range', () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(0.5, 0, 1)).toBe(0.5);
    });

    test('clamps to min when below range', () => {
        expect(clamp(-1, 0, 10)).toBe(0);
        expect(clamp(-100, 0, 10)).toBe(0);
        expect(clamp(-0.5, 0, 1)).toBe(0);
    });

    test('clamps to max when above range', () => {
        expect(clamp(15, 0, 10)).toBe(10);
        expect(clamp(100, 0, 10)).toBe(10);
        expect(clamp(1.5, 0, 1)).toBe(1);
    });

    test('handles equal bounds', () => {
        expect(clamp(5, 5, 5)).toBe(5);
        expect(clamp(0, 0, 0)).toBe(0);
        expect(clamp(-1, 3, 3)).toBe(3);
    });

    test('handles negative ranges', () => {
        expect(clamp(-5, -10, -1)).toBe(-5);
        expect(clamp(-20, -10, -1)).toBe(-10);
        expect(clamp(0, -10, -1)).toBe(-1);
    });

    test('handles floats', () => {
        expect(clamp(0.5, 0, 1)).toBe(0.5);
        expect(clamp(1.5, 0, 1)).toBe(1);
        expect(clamp(-0.5, 0, 1)).toBe(0);
    });

    test('handles zero as min', () => {
        expect(clamp(-0.001, 0, 10)).toBe(0);
    });

    test('handles zero as max', () => {
        expect(clamp(0.001, -10, 0)).toBe(0);
    });
});

describe('random', () => {
    test('returns integer in [min, max) range', () => {
        const results = [];
        for (let i = 0; i < 1000; i++) {
            const r = random(0, 10);
            expect(r).toBeGreaterThanOrEqual(0);
            expect(r).toBeLessThan(10);
            expect(Number.isInteger(r)).toBe(true);
            results.push(r);
        }
        // Should produce variety
        expect(new Set(results).size).toBeGreaterThan(5);
    });

    test('returns correct range for arbitrary bounds', () => {
        const results = [];
        for (let i = 0; i < 1000; i++) {
            const r = random(5, 15);
            expect(r).toBeGreaterThanOrEqual(5);
            expect(r).toBeLessThan(15);
            results.push(r);
        }
        expect(new Set(results).size).toBeGreaterThan(5);
    });

    test('returns element from array', () => {
        const arr = [1, 2, 3, 4, 5];
        const results = [];
        for (let i = 0; i < 100; i++) {
            const r = random(arr);
            expect(arr).toContain(r);
            results.push(r);
        }
    });

    test('returns element from empty array edge case', () => {
        expect(random([])).toBeUndefined();
    });

    test('single element array returns that element', () => {
        const results = [];
        for (let i = 0; i < 10; i++) {
            results.push(random([42]));
        }
        expect(results.every(r => r === 42)).toBe(true);
    });

    test('returns integer in [0, min) when only min given', () => {
        const results = [];
        for (let i = 0; i < 1000; i++) {
            const r = random(10);
            expect(r).toBeGreaterThanOrEqual(0);
            expect(r).toBeLessThan(10);
            expect(Number.isInteger(r)).toBe(true);
            results.push(r);
        }
    });
});
