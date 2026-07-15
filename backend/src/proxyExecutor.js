import FormData from "form-data"
import {assertUrlIsSafe} from "./ssrfguard.js";
import { filterInboundHeaders, filterOutboundHeaders } from "./headerFilter.js";

const TIMEOUT_MS = 30_000;
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024; // 8MB

function buildBody(bodyMode, body, formFields, headers) {
    if (bodyMode === "formdata") {
        // Send as application/x-www-form-urlencoded — far more compatible than
        // multipart/form-data which needs multer on the target server.
        // express.urlencoded() (standard Express middleware) handles this natively.
        const params = new URLSearchParams();
        (formFields || []).forEach(({ key, value }) => params.append(key, value));
        delete headers["Content-Type"];
        delete headers["content-type"];
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        return params.toString();
    }
    if (bodyMode === "raw") {
        const rawBody = body ?? "";
        // Auto-set Content-Type if the user hasn't provided one.
        // This mirrors what Postman does when you pick "Raw > JSON" —
        // without it, Express's json() middleware on the target server
        // ignores the body and req.body comes back as {}.
        const hasContentType = Object.keys(headers).some(
        (k) => k.toLowerCase() === "content-type"
        );
        if (!hasContentType) {
        const trimmed = rawBody.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
            headers["Content-Type"] = "application/json";
        } else {
            headers["Content-Type"] = "text/plain";
        }
        }
        return rawBody;
    }
    return undefined; // "none"
}

/**
 * Executes a proxied HTTP request based on the validated request config.
 * Returns a plain object:
 *  { success: true, ... } - Represents the target backend has sent a response(success or error does not matter). 
 *  { success: false, errorType, message } - Represents the proxy backend is down or no response from target backend
 */
export async function executeProxyRequest({ method, url, headers, bodyMode, body, formFields }) {
    // 1. Validate + SSRF check ( Please disable it to hit localhost - Local testing)
    // try {
    //     await assertUrlIsSafe(url);
    // } catch (e) {
    //     return { success: false, errorType: e.errorType || "INVALID_URL", message: e.message };
    // }

    const outboundHeaders = filterOutboundHeaders(headers || {});
    const finalBody = buildBody(bodyMode, body, formFields, outboundHeaders);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const startTime = Date.now();
    let response;
    try {
        response = await fetch(url, {
            method,
            headers: outboundHeaders,
            body: method === "GET" || method === "HEAD" ? undefined : finalBody,
            signal: controller.signal,
            redirect: "follow",
        });
    } catch (e) {
        clearTimeout(timeoutId);
        if (e.name === "AbortError") {
            return { success: false, errorType: "TIMEOUT", message: "Request timed out after 30s" };
        }
        if (e.code === "ENOTFOUND" || e.code === "EAI_AGAIN") {
            return { success: false, errorType: "DNS_FAILURE", message: "Could not resolve hostname" };
        }
        if (e.code === "ECONNREFUSED") {
            return { success: false, errorType: "CONNECTION_REFUSED", message: "Connection refused by target server" };
        }
        return { success: false, errorType: "CONNECTION_REFUSED", message: e.message || "Failed to reach target server" };
    }
    clearTimeout(timeoutId);

    // Enforce max response size while reading the body
    const chunks = [];
    let totalBytes = 0;
    try {
        for await (const chunk of response.body) {
        totalBytes += chunk.length;
        if (totalBytes > MAX_RESPONSE_BYTES) {
            response.body.destroy();
            return {
            success: false,
            errorType: "RESPONSE_TOO_LARGE",
            message: `Response exceeded ${MAX_RESPONSE_BYTES / (1024 * 1024)}MB limit`,
            };
        }
        chunks.push(chunk);
        }
    } catch (e) {
        return { success: false, errorType: "CONNECTION_REFUSED", message: "Connection lost while reading response" };
    }

    const bodyText = Buffer.concat(chunks).toString("utf-8");
    const durationMs = Date.now() - startTime;

    const responseHeaders = {};
        response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
    });

    return {
        success: true,
        status: response.status,
        statusText: response.statusText,
        headers: filterInboundHeaders(responseHeaders),
        body: bodyText,
        timing: { durationMs },
    };
}


