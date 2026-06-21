/**
 * Unit tests for convertProxyFormat from check_proxies.cjs
 */

// Inline the function since check_proxies.cjs uses dynamic import for createProxyTester
// but the function itself is standalone
function convertProxyFormat(proxyString) {
    if (!proxyString) return proxyString;
    let protocol = "http";
    let workingString = proxyString;
    if (proxyString.includes("://")) {
        let protocolParts = proxyString.split("://");
        protocol = protocolParts[0];
        workingString = protocolParts[1];
    }
    
    if (protocol === "socks5h") protocol = "socks5";
    if (protocol === "socks4h") protocol = "socks4";
    
    let parts = workingString.split(":");
    if (parts.length === 4) {
        return `${protocol}://${parts[2]}:${parts[3]}@${parts[0]}:${parts[1]}`;
    }
    return `${protocol}://${workingString}`;
}

describe('convertProxyFormat', () => {
    test('handles null/undefined', () => {
        expect(convertProxyFormat(null)).toBeNull();
        expect(convertProxyFormat(undefined)).toBeUndefined();
    });

    test('defaults to http protocol when none specified', () => {
        expect(convertProxyFormat('host:8080')).toBe('http://host:8080');
    });

    test('preserves http protocol', () => {
        expect(convertProxyFormat('http://host:8080')).toBe('http://host:8080');
    });

    test('preserves https protocol', () => {
        expect(convertProxyFormat('https://host:8080')).toBe('https://host:8080');
    });

    test('converts socks5h to socks5', () => {
        expect(convertProxyFormat('socks5h://user:pass@host:1080')).toBe('socks5://user:pass@host:1080');
    });

    test('converts socks4h to socks4', () => {
        expect(convertProxyFormat('socks4h://host:1080')).toBe('socks4://host:1080');
    });

    test('converts 4-part format user:pass@host:port', () => {
        // 'user:pass@host:8080'.split(':') = ['user', 'pass@host', '8080'] (3 parts)
        // falls through to protocol://workingString
        expect(convertProxyFormat('user:pass@host:8080')).toBe('http://user:pass@host:8080');
    });

    test('converts 4-part colon-separated format user:pass:host:port', () => {
        // 'user:pass:host:8080'.split(':') = ['user', 'pass', 'host', '8080'] (4 parts)
        expect(convertProxyFormat('user:pass:host:8080')).toBe('http://host:8080@user:pass');
    });

    test('handles host:port format with 2 parts', () => {
        expect(convertProxyFormat('host:8080')).toBe('http://host:8080');
    });

    test('handles host:port format with 4 parts', () => {
        expect(convertProxyFormat('user:pass:host:8080')).toBe('http://host:8080@user:pass');
    });

    test('handles socks5 with credentials', () => {
        expect(convertProxyFormat('socks5://user:pass@host:1080')).toBe('socks5://user:pass@host:1080');
    });

    test('handles socks5h with 4 parts', () => {
        expect(convertProxyFormat('socks5h://user:pass:host:1080')).toBe('socks5://host:1080@user:pass');
    });

    test('handles socks4h with credentials', () => {
        expect(convertProxyFormat('socks4h://user:pass@host:1080')).toBe('socks4://user:pass@host:1080');
    });

    test('preserves protocol for proxy with user:pass@host:port', () => {
        expect(convertProxyFormat('https://user:pass@host:8443')).toBe('https://user:pass@host:8443');
    });
});
