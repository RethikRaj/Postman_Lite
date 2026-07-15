import { useState } from "react";

function statusBadge(status) {
  if (status >= 200 && status < 300) return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  if (status >= 300 && status < 400) return "bg-blue-500/10    text-blue-400    border border-blue-500/20";
  if (status >= 400 && status < 500) return "bg-amber-500/10   text-amber-400   border border-amber-500/20";
  return                                     "bg-red-500/10     text-red-400     border border-red-500/20";
}

function byteSize(str) {
  const bytes = new TextEncoder().encode(str).length;
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

/**
 * Renders syntax-highlighted JSON as pure React elements — no dangerouslySetInnerHTML.
 * Tokenises the pretty-printed string with a regex and wraps each token in a <span>
 * with the correct className. Plain text segments are rendered as text nodes.
 */
function HighlightedJson({ json }) {
  const TOKEN_RE =
    /("(?:\u[a-fA-F0-9]{4}|\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = TOKEN_RE.exec(json)) !== null) {
    // Plain text before this token (punctuation, whitespace, braces…)
    if (match.index > lastIndex) {
      parts.push(
        <span key={`t-${lastIndex}`} className="text-neutral-400">
          {json.slice(lastIndex, match.index)}
        </span>
      );
    }

    const token = match[0];
    let cls;
    if (/^"/u.test(token)) {
      cls = /:$/.test(token) ? "json-key" : "json-string";
    } else if (token === "true" || token === "false") {
      cls = "json-boolean";
    } else if (token === "null") {
      cls = "json-null";
    } else {
      cls = "json-number";
    }

    parts.push(
      <span key={`m-${match.index}`} className={cls}>{token}</span>
    );
    lastIndex = match.index + token.length;
  }

  // Remaining text after the last token
  if (lastIndex < json.length) {
    parts.push(
      <span key="tail" className="text-neutral-400">
        {json.slice(lastIndex)}
      </span>
    );
  }

  return <>{parts}</>;
}

export default function ResponseViewer({ response, loading }) {
  const [responseTab, setResponseTab] = useState("body");
  const [bodyView, setBodyView] = useState("pretty");
  const [copied, setCopied] = useState(false);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-neutral-600">
        <svg className="animate-spin text-orange-500" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round"/>
        </svg>
        <span className="text-sm text-neutral-500">Sending request…</span>
      </div>
    );
  }

  /* ── Empty state ── */
  if (!response) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-neutral-800">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <p className="text-sm text-neutral-600">
          Hit <span className="text-orange-500 font-medium">Send</span> to get a response
          <span className="text-neutral-700"> · Ctrl+Enter</span>
        </p>
      </div>
    );
  }

  /* ── Error state ── */
  if (!response.success) {
    return (
      <div className="flex-1 p-5">
        <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400 shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <p className="text-red-400 text-sm font-semibold tracking-wide">{response.errorType}</p>
          </div>
          <p className="text-red-300/70 text-sm leading-relaxed pl-5">{response.message}</p>
        </div>
      </div>
    );
  }

  /* ── Success state ── */
  const contentType = response.headers?.["content-type"] || "";
  const isJson = contentType.includes("application/json");

  // Build the display body
  let prettyBody = response.body;
  let isValidJson = false;
  if (isJson) {
    try {
      prettyBody = JSON.stringify(JSON.parse(response.body), null, 2);
      isValidJson = true;
    } catch { /* leave as-is */ }
  }

  const displayBody = bodyView === "pretty" ? prettyBody : response.body;
  const useHighlight = bodyView === "pretty" && isValidJson;
  const headerCount = Object.keys(response.headers || {}).length;


  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Status bar ── */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-neutral-800 bg-neutral-900/30 shrink-0">
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full font-mono ${statusBadge(response.status)}`}>
          {response.status} {response.statusText}
        </span>
        <span className="text-xs text-neutral-600">{response.timing?.durationMs} ms</span>
        <span className="text-xs text-neutral-600">{byteSize(response.body)}</span>
      </div>

      {/* ── Response tab bar ── */}
      <div className="flex items-center justify-between border-b border-neutral-800 px-5 shrink-0">
        <div className="flex">
          {[
            { id: "body",    label: "Body" },
            { id: "headers", label: `Headers (${headerCount})` },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setResponseTab(id)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
                responseTab === id
                  ? "border-orange-500 text-orange-400"
                  : "border-transparent text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right controls: Pretty/Raw + Copy */}
        <div className="flex items-center gap-2">
          {responseTab === "body" && (
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-md p-0.5 gap-0.5">
              {["pretty", "raw"].map((v) => (
                <button
                  key={v}
                  onClick={() => setBodyView(v)}
                  className={`text-[10px] px-2.5 py-0.5 rounded capitalize transition-colors ${
                    bodyView === v
                      ? "bg-neutral-700 text-neutral-100"
                      : "text-neutral-600 hover:text-neutral-300"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}

          {/* Copy button */}
          <button
            onClick={() => {
              const text = responseTab === "body" ? displayBody : JSON.stringify(response.headers, null, 2);
              navigator.clipboard.writeText(text).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
            className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-md border transition-colors ${
              copied
                ? "border-emerald-700 text-emerald-400 bg-emerald-900/20"
                : "border-neutral-800 text-neutral-600 hover:text-neutral-300 hover:border-neutral-700"
            }`}
          >
            {copied ? (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-auto">
        {responseTab === "body" && (
          useHighlight ? (
            <pre className="p-5 text-xs whitespace-pre-wrap break-all font-mono leading-relaxed">
              <HighlightedJson json={displayBody} />
            </pre>
          ) : (
            <pre className="p-5 text-xs text-neutral-300 whitespace-pre-wrap break-all font-mono leading-relaxed">
              {displayBody}
            </pre>
          )
        )}

        {responseTab === "headers" && (
          <div className="p-5 space-y-1.5">
            {Object.entries(response.headers || {}).map(([k, v]) => (
              <div key={k} className="flex gap-3 text-xs font-mono">
                <span className="text-orange-400/70 shrink-0 min-w-0">{k}:</span>
                <span className="text-neutral-500 break-all">{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
