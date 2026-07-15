// Headers stripped from what the frontend sends before forwarding to target
const OUTBOUND_BLOCKLIST = new Set([
  "host",
  "content-length",
  "connection",
  "transfer-encoding",
]);

// Headers stripped from the target's response before returning to frontend
const INBOUND_BLOCKLIST = new Set(["content-encoding", "transfer-encoding"]);


export function filterOutboundHeaders(headers = {}) {
    const result = {};
    for (const [key, value] of Object.entries(headers)) {
        if (!OUTBOUND_BLOCKLIST.has(key.toLowerCase())) {
            result[key] = value;
        }
    }
    return result;
}

export function filterInboundHeaders(headers = {}) {
    const result = {};
    for (const [key, value] of Object.entries(headers)) {
        if (!INBOUND_BLOCKLIST.has(key.toLowerCase())) {
            result[key] = value;
        }
    }
    return result;
}