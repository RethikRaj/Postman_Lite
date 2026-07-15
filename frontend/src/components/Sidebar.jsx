import { useState } from "react";
import { useAppState } from "../context/AppStateContext";

const METHOD_COLORS = {
  GET:    "text-emerald-400 bg-emerald-400/10",
  POST:   "text-amber-400  bg-amber-400/10",
  PUT:    "text-blue-400   bg-blue-400/10",
  PATCH:  "text-purple-400 bg-purple-400/10",
  DELETE: "text-red-400    bg-red-400/10",
  HEAD:   "text-neutral-400 bg-neutral-400/10",
};

/* ── Icons ── */
function IconMenu()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>; }
function IconPlus()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IconChevron({ open }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      className={`transition-transform duration-150 shrink-0 ${open ? "rotate-90" : ""}`}>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}
function IconFolder() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-orange-500/80 shrink-0"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>; }
function IconTrash()  { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>; }
function IconX()      { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }

export default function Sidebar({ onSelectRequest, activeRequestId }) {
  const { collections, createCollection, deleteCollection, deleteRequest } = useAppState();
  const [expanded, setExpanded] = useState({});
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showInput, setShowInput] = useState(false);

  function toggleExpanded(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!newCollectionName.trim()) return;
    createCollection(newCollectionName.trim());
    setNewCollectionName("");
    setShowInput(false);
  }

  return (
    <div className="w-64 shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col h-full">

      {/* Workspace header */}
      {/* <div className="flex items-center gap-2 px-3 py-3 border-b border-neutral-800">
        <span className="text-orange-500/80"><IconMenu /></span>
        <span className="text-xs font-semibold text-neutral-300 select-none">My Workspace</span>
      </div> */}

      {/* Collections label + add button */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
        <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">
          Collections
        </span>
        <button
          onClick={() => setShowInput((v) => !v)}
          className="p-0.5 rounded hover:bg-neutral-800 text-neutral-600 hover:text-orange-400 transition-colors"
          title="New collection"
        >
          <IconPlus />
        </button>
      </div>

      {/* New collection input */}
      {showInput && (
        <form onSubmit={handleCreate} className="px-3 pb-2 flex gap-1">
          <input
            autoFocus
            type="text"
            placeholder="Collection name…"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-xs text-neutral-100 focus:outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            className="bg-orange-600 hover:bg-orange-500 text-white text-xs px-2.5 rounded transition-colors"
          >
            Add
          </button>
        </form>
      )}

      {/* Collections list */}
      <div className="flex-1 overflow-y-auto py-1">
        {collections.length === 0 && (
          <p className="text-xs text-neutral-600 text-center px-3 py-6">
            No collections yet. <br />
            <button onClick={() => setShowInput(true)} className="text-orange-500 hover:underline">
              Create one
            </button>
          </p>
        )}

        {collections.map((col) => (
          <div key={col.id}>
            {/* Collection row */}
            <div
              className="group flex items-center gap-1.5 px-3 py-2 hover:bg-neutral-800/60 cursor-pointer select-none"
              onClick={() => toggleExpanded(col.id)}
            >
              <span className="text-neutral-600"><IconChevron open={expanded[col.id]} /></span>
              <IconFolder />
              <span className="text-xs text-neutral-300 truncate flex-1">{col.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${col.name}" and all its requests?`)) deleteCollection(col.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-neutral-600 hover:text-red-400 transition-all"
                title="Delete collection"
              >
                <IconTrash />
              </button>
            </div>

            {/* Request list */}
            {expanded[col.id] && (
              <div className="pb-1">
                {col.requests.length === 0 && (
                  <p className="text-[11px] text-neutral-600 py-1.5 pl-10">No requests yet</p>
                )}
                {col.requests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => onSelectRequest(col.id, req)}
                    className={`group flex items-center gap-2 pl-9 pr-3 py-1.5 cursor-pointer transition-colors ${
                      activeRequestId === req.id
                        ? "bg-orange-500/10 border-r-2 border-orange-500"
                        : "hover:bg-neutral-800/60"
                    }`}
                  >
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${METHOD_COLORS[req.method] || "text-neutral-400 bg-neutral-400/10"}`}>
                      {req.method}
                    </span>
                    <span className={`text-xs truncate flex-1 ${activeRequestId === req.id ? "text-orange-300" : "text-neutral-500"}`}>
                      {req.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${req.name}"?`)) deleteRequest(col.id, req.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-neutral-600 hover:text-red-400 transition-all shrink-0"
                    >
                      <IconX />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
