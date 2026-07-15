import dns from "dns/promises";
import net from "net";

// Blocked ranges: loopback, private networks, link-local (cloud metadata lives here)
// bits denote the number of bits used to identify the network.
const BLOCKED_RANGES_V4 = [
    { base: "127.0.0.0", bits: 8 },
    { base: "10.0.0.0", bits: 8 },
    { base: "172.16.0.0", bits: 12 },
    { base: "192.168.0.0", bits: 16 },
    { base: "169.254.0.0", bits: 16 },
    { base: "0.0.0.0", bits: 8 },
];

function ipToLong(ip) {
    return ip
        .split(".")
        .reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isIpv4InRange(ip, base, bits) {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (ipToLong(ip) & mask) === (ipToLong(base) & mask);
}

export function isBlockedIp(ip) {
    if (net.isIPv6(ip)) {
        // Block IPv6 loopback and link-local/unique-local ranges
        const lower = ip.toLowerCase();
        if (lower === "::1") return true;
        if (lower.startsWith("fe80:")) return true; // link-local
        if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
        return false;
    }
    if (net.isIPv4(ip)) {
        return BLOCKED_RANGES_V4.some((r) => isIpv4InRange(ip, r.base, r.bits));
    }
    return true; // unknown format -> block to be safe
}

/**
 * Resolves the hostname in the given URL and checks whether it points
 * to a private/internal address. Throws an Error with code 'BLOCKED_SSRF'
 * or 'DNS_FAILURE' if applicable.
 */
export async function assertUrlIsSafe(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch (e) {
    const err = new Error("Invalid URL");
    err.errorType = "INVALID_URL";
    throw err;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    const err = new Error("Only http/https protocols are allowed");
    err.errorType = "INVALID_URL";
    throw err;
  }

  const hostname = parsed.hostname;

    // If hostname is already a literal IP, skip DNS lookup
    if (net.isIP(hostname)) {
        if (isBlockedIp(hostname)) {
            const err = new Error("Target address is blocked (private/internal range)");
            err.errorType = "BLOCKED_SSRF";
            throw err;
        }
        return;
    }

    let addresses;
    try {
        addresses = await dns.lookup(hostname, { all: true });
    } catch (e) {
        const err = new Error("Could not resolve hostname");
        err.errorType = "DNS_FAILURE";
        throw err;
    }

    for (const { address } of addresses) {
        if (isBlockedIp(address)) {
            const err = new Error("Target address is blocked (private/internal range)");
            err.errorType = "BLOCKED_SSRF";
            throw err;
        }
    }
}

