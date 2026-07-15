const PROXY_BASE_URL = import.meta.env.VITE_PROXY_BASE_URL || "http://localhost:4000";

/**
 * Sends a resolved request to the backend proxy and returns the parsed JSON result.
 * Shape: { success: true, status, statusText, headers, body, timing }
 *     or { success: false, errorType, message }
 */
export async function sendProxyRequest(resolvedRequest) {
  try {
    const res = await fetch(`${PROXY_BASE_URL}/api/proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(resolvedRequest),
    });
    return await res.json();
  } catch (e) {
    return {
      success: false,
      errorType: "NETWORK_ERROR",
      message: "Could not reach the proxy server. Is the backend running?",
    };
  }
}
