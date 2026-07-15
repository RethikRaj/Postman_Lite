import { useState, useEffect, useRef } from "react";
import KeyValueEditor from "./KeyValueEditor";
import ResponseViewer from "./ResponseViewer";
import SaveRequestModal from "./SaveRequestModal";
import Toast from "./Toast";
import { useAppState } from "../context/AppStateContext";
import { resolveRequest } from "../lib/resolveVariables";
import { sendProxyRequest } from "../lib/apiClient";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"];
const BODY_METHODS = new Set(["POST", "PUT", "PATCH"]);

const METHOD_COLORS = {
  GET:    "text-emerald-400",
  POST:   "text-amber-400",
  PUT:    "text-blue-400",
  PATCH:  "text-purple-400",
  DELETE: "text-red-400",
  HEAD:   "text-neutral-400",
};

function emptyDraft() {
  return {
    id: null,
    name: "",
    method: "GET",
    url: "",
    headers:   [{ key: "", value: "", enabled: true }],
    params:    [{ key: "", value: "", enabled: true }],
    bodyMode: "none",
    body: "",
    formFields: [{ key: "", value: "", enabled: true }],
  };
}

/** Build a URL by merging the base (no query string) with the params rows. */
function buildUrlWithParams(base, rows) {
  const qs = rows
    .filter((r) => r.enabled && r.key.trim())
    .map((r) => `${encodeURIComponent(r.key)}=${encodeURIComponent(r.value)}`)
    .join("&");
  return qs ? `${base}?${qs}` : base;
}

/** Parse query string from a URL and return param rows. */
function parseParamsFromUrl(url) {
  const qIdx = url.indexOf("?");
  if (qIdx === -1) return null; // no query string
  try {
    const pairs = [...new URLSearchParams(url.slice(qIdx + 1)).entries()];
    return pairs.map(([k, v]) => ({ key: k, value: v, enabled: true }));
  } catch {
    return null;
  }
}

export default function RequestBuilder({ draft, setDraft, collectionId, activeCollection }) {
  const { activeEnv } = useAppState();
  const [activeTab, setActiveTab] = useState("params");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [toast, setToast] = useState(null);

  function updateField(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  /** When user edits the URL input — sync params rows from query string */
  function handleUrlChange(newUrl) {
    setDraft((prev) => {
      const parsed = parseParamsFromUrl(newUrl);
      if (parsed !== null) {
        // Update params rows to match what's in the URL
        return {
          ...prev,
          url: newUrl,
          params: parsed.length
            ? [...parsed, { key: "", value: "", enabled: true }]
            : [{ key: "", value: "", enabled: true }],
        };
      }
      // No query string — clear param keys if url has no "?"
      return { ...prev, url: newUrl, params: [{ key: "", value: "", enabled: true }] };
    });
  }

  /** When user edits params rows — rebuild the URL query string */
  function handleParamsChange(rows) {
    setDraft((prev) => {
      const base = prev.url.split("?")[0];
      return { ...prev, params: rows, url: buildUrlWithParams(base, rows) };
    });
  }

  async function handleSend() {
    if (!draft.url.trim() || loading) return;
    setLoading(true);
    setResponse(null);
    const resolved = resolveRequest(draft, activeEnv);
    const result = await sendProxyRequest(resolved);
    setResponse(result);
    setLoading(false);
  }

  // ── Ctrl+Enter / Cmd+Enter to Send ──
  const handleSendRef = useRef(handleSend);
  useEffect(() => { handleSendRef.current = handleSend; });
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSendRef.current();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const bodyNeedsAttention = BODY_METHODS.has(draft.method) && draft.bodyMode === "none";
  const hasParams = draft.params?.some((p) => p.enabled && p.key.trim());

  // Tab definitions
  const tabs = [
    { id: "params",  label: "Params",  dot: hasParams },
    { id: "headers", label: "Headers", dot: draft.headers?.some((h) => h.enabled && h.key.trim()) },
    { id: "body",    label: "Body",    dot: draft.bodyMode !== "none", pulse: bodyNeedsAttention && activeTab !== "body" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">

      {/* ── Breadcrumb (only for saved requests) ── */}
      {activeCollection && draft.id && (
        <div className="flex items-center gap-1.5 px-5 pt-3 pb-0.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-neutral-700 shrink-0">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <span className="text-xs text-neutral-700">{activeCollection.name}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-neutral-800">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span className="text-xs text-neutral-500 truncate">{draft.name || "Untitled"}</span>
        </div>
      )}

      {/* ── Request name (inline-edit) ── */}
      <div className="group relative px-5 pt-3 pb-1">
        <input
          type="text"
          value={draft.name || ""}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="Untitled Request"
          spellCheck={false}
          className="text-sm font-medium text-neutral-400 bg-transparent focus:outline-none focus:text-neutral-200 placeholder-neutral-600 w-full border-b border-transparent group-hover:border-neutral-700 focus:border-orange-500 pb-0.5 pr-6 transition-colors cursor-text"
        />
        {/* Pencil icon — visible on hover, hidden on focus */}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeJoin="round"
          className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-700 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </div>

      {/* ── URL bar ── */}
      <div className="flex items-center gap-2 px-5 pb-4">
        {/* Method select */}
        <div className="relative shrink-0">
          <select
            value={draft.method}
            onChange={(e) => updateField("method", e.target.value)}
            className={`appearance-none bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg px-3 py-2 pr-6 text-sm font-bold font-mono cursor-pointer focus:outline-none focus:border-orange-500 transition-colors ${METHOD_COLORS[draft.method] || "text-neutral-400"}`}
          >
            {METHODS.map((m) => (
              <option key={m} value={m} className="text-neutral-100 bg-neutral-900">{m}</option>
            ))}
          </select>
          <svg className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

        {/* URL input */}
        <input
          type="text"
          placeholder="https://api.example.com/endpoint  or  {{baseUrl}}/path"
          value={draft.url}
          onChange={(e) => handleUrlChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          spellCheck={false}
          className="flex-1 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 focus:border-orange-500 rounded-lg px-4 py-2 text-sm text-neutral-200 font-mono focus:outline-none placeholder-neutral-700 transition-colors"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={loading}
          title="Send (Ctrl+Enter)"
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors shrink-0"
        >
          {loading ? (
            <>
              <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round"/>
              </svg>
              Sending
            </>
          ) : "Send"}
        </button>

        {/* Save button */}
        <button
          onClick={() => setShowSaveModal(true)}
          className="border border-neutral-700 hover:bg-neutral-800 text-neutral-300 hover:text-neutral-100 text-sm px-4 py-2 rounded-lg transition-colors shrink-0"
        >
          Save
        </button>
      </div>

      {/* ── Tabs (Params / Headers / Body) ── */}
      <div className="flex border-b border-neutral-800 px-5">
        {tabs.map(({ id, label, dot, pulse }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`relative px-4 py-2.5 text-xs font-medium capitalize border-b-2 -mb-px transition-colors ${
              activeTab === id
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {label}
            {dot && !pulse && (
              <span className="absolute top-2 right-1 w-1 h-1 rounded-full bg-orange-500" />
            )}
            {pulse && (
              <span className="absolute top-2 right-1 w-1 h-1 rounded-full bg-orange-500 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="px-5 py-3 border-b border-neutral-800 max-h-64 overflow-y-auto">

        {/* Params */}
        {activeTab === "params" && (
          <div className="flex flex-col gap-2">
            {/* {hasParams && (
              <p className="text-[10px] text-neutral-700 flex items-center gap-1">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                Params are synced with the URL above
              </p>
            )} */}
            <KeyValueEditor
              rows={draft.params}
              onChange={handleParamsChange}
              keyPlaceholder="Parameter"
              valuePlaceholder="Value"
            />
          </div>
        )}

        {/* Headers */}
        {activeTab === "headers" && (
          <KeyValueEditor
            rows={draft.headers}
            onChange={(rows) => updateField("headers", rows)}
          />
        )}

        {/* Body */}
        {activeTab === "body" && (
          <div className="flex flex-col gap-3">
            {/* Body mode selector */}
            <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1 w-fit">
              {["none", "raw", "formdata"].map((mode) => (
                <label
                  key={mode}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-md cursor-pointer transition-colors select-none ${
                    draft.bodyMode === mode
                      ? "bg-neutral-700 text-neutral-100"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  <input type="radio" className="hidden" checked={draft.bodyMode === mode} onChange={() => updateField("bodyMode", mode)} />
                  {mode === "raw" ? "Raw" : mode === "formdata" ? "Form Data" : "None"}
                </label>
              ))}
            </div>

            {draft.bodyMode === "raw" && (
              <textarea
                value={draft.body}
                onChange={(e) => updateField("body", e.target.value)}
                placeholder={'{\n  "key": "value"\n}'}
                rows={8}
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-orange-500 rounded-lg px-4 py-3 text-sm text-neutral-200 font-mono focus:outline-none resize-none placeholder-neutral-700 transition-colors leading-relaxed"
              />
            )}
            {draft.bodyMode === "formdata" && (
              <KeyValueEditor
                rows={draft.formFields}
                onChange={(rows) => updateField("formFields", rows)}
                keyPlaceholder="Field name"
                valuePlaceholder="Value"
              />
            )}
            {draft.bodyMode === "none" && bodyNeedsAttention && (
              <p className="text-xs text-amber-500/70 flex items-center gap-1.5 mt-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Select a body mode to send data with this {draft.method} request
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Response ── */}
      <ResponseViewer response={response} loading={loading} />

      {/* ── Modals + Toast ── */}
      {showSaveModal && (
        <SaveRequestModal
          requestDraft={draft}
          onClose={() => setShowSaveModal(false)}
          onSaved={(msg) => setToast({ message: msg, type: "success" })}
        />
      )}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}

export { emptyDraft };
