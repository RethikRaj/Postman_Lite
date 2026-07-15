/**
 * Replaces {{key}} placeholders in a string using the given variables list.
 * Only enabled variables are used. Unmatched placeholders are left as-is.
 */
export function resolveVariables(text, variables = []) {
  if (!text) return text;
  const map = new Map(
    variables.filter((v) => v.enabled && v.key).map((v) => [v.key, v.value])
  );
  return text.replace(/\{\{(.*?)\}\}/g, (match, rawKey) => {
    const key = rawKey.trim();
    return map.has(key) ? map.get(key) : match;
  });
}

/**
 * Resolves variables across an entire request object (url, headers, body, formFields)
 * using the active environment's variables.
 */
export function resolveRequest(request, activeEnv) {
  const variables = activeEnv?.variables || [];

  const resolvedUrl = resolveVariables(request.url, variables);

  const resolvedHeaders = {};
  (request.headers || [])
    .filter((h) => h.enabled && h.key)
    .forEach((h) => {
      resolvedHeaders[resolveVariables(h.key, variables)] = resolveVariables(
        h.value,
        variables
      );
    });

  const resolvedBody =
    request.bodyMode === "raw" ? resolveVariables(request.body, variables) : request.body;

  const resolvedFormFields = (request.formFields || [])
    .filter((f) => f.enabled && f.key)
    .map((f) => ({
      key: resolveVariables(f.key, variables),
      value: resolveVariables(f.value, variables),
    }));

  return {
    method: request.method,
    url: resolvedUrl,
    headers: resolvedHeaders,
    bodyMode: request.bodyMode,
    body: resolvedBody,
    formFields: resolvedFormFields,
  };
}
