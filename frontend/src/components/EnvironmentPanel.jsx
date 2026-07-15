import { useState } from "react";
import { useAppState } from "../context/AppStateContext";
import KeyValueEditor from "./KeyValueEditor";

/* ── SVG icons ── */
function IconX({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export default function EnvironmentPanel({ onClose }) {
  const {
    environments,
    activeEnvId,
    setActiveEnvId,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
  } = useAppState();

  const [selectedId, setSelectedId] = useState(environments[0]?.id || null);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");

  const selectedEnv = environments.find((e) => e.id === selectedId);

  function handleCreate(e) {
    e.preventDefault();
    if (!newEnvName.trim()) return;
    const created = createEnvironment(newEnvName.trim());
    setSelectedId(created.id);
    setNewEnvName("");
    setShowCreateInput(false);
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-[750px] h-[500px] flex flex-col shadow-2xl overflow-hidden">

        {/* ── Modal header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-neutral-100">Environments</h3>
            <p className="text-xs text-neutral-600 mt-0.5">
              Reference variables with{" "}
              <code className="text-orange-400 font-mono bg-orange-400/10 px-1 py-0.5 rounded text-[11px]">
                {"{{variable}}"}
              </code>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            <IconX size={14} />
          </button>
        </div>

        {/* ── Two-column body ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── LEFT: environment list ── */}
          <div className="w-52 shrink-0 border-r border-neutral-800 flex flex-col overflow-hidden">

            {/* Section label + add button */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-800 shrink-0">
              <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">
                Environments
              </span>
              <button
                onClick={() => { setShowCreateInput((v) => !v); setNewEnvName(""); }}
                className="p-1 rounded hover:bg-neutral-800 text-neutral-600 hover:text-orange-400 transition-colors"
                title="New environment"
              >
                <IconPlus />
              </button>
            </div>

            {/* Inline create input — appears just below the label row */}
            {showCreateInput && (
              <form onSubmit={handleCreate} className="flex items-center gap-1.5 px-3 py-2 border-b border-neutral-800 shrink-0">
                <input
                  autoFocus
                  type="text"
                  placeholder="Name…"
                  value={newEnvName}
                  onChange={(e) => setNewEnvName(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setShowCreateInput(false)}
                  className="flex-1 min-w-0 bg-neutral-800 border border-neutral-700 focus:border-orange-500 rounded-md px-2 py-1 text-xs text-neutral-100 focus:outline-none placeholder-neutral-600 transition-colors"
                />
                <button
                  type="submit"
                  className="shrink-0 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-md transition-colors"
                >
                  Add
                </button>
              </form>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto py-1">
              {environments.length === 0 && !showCreateInput && (
                <p className="text-xs text-neutral-600 text-center py-8 px-3">
                  No environments yet.<br />
                  <button onClick={() => setShowCreateInput(true)} className="text-orange-500 hover:underline mt-1 inline-block">
                    Create one
                  </button>
                </p>
              )}

              {environments.map((env) => (
                <div
                  key={env.id}
                  onClick={() => { setSelectedId(env.id); setActiveEnvId(env.id); }}
                  className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors ${
                    selectedId === env.id
                      ? "bg-orange-500/10 border-r-2 border-orange-500"
                      : "hover:bg-neutral-800/60"
                  }`}
                >
                  {/* Active radio */}
                  <input
                    type="radio"
                    checked={activeEnvId === env.id}
                    onChange={() => {}}
                    onClick={(e) => { e.stopPropagation(); setActiveEnvId(env.id); setSelectedId(env.id); }}
                    className="accent-orange-500 shrink-0 cursor-pointer"
                    title="Set as active"
                  />
                  <span className={`text-xs truncate flex-1 ${
                    selectedId === env.id ? "text-orange-300" : "text-neutral-300"
                  }`}>
                    {env.name}
                  </span>
                  {/* Delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEnvironment(env.id);
                      if (selectedId === env.id) setSelectedId(null);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-neutral-600 hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0"
                    title="Delete"
                  >
                    <IconTrash />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: variable editor ── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!selectedEnv ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-neutral-800">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <p className="text-xs text-neutral-600">Select an environment to edit variables</p>
              </div>
            ) : (
              <>
                {/* Column headers */}
                <div className="grid grid-cols-[1.5rem_1fr_1fr_1.5rem] gap-2 items-center px-4 py-2.5 border-b border-neutral-800 shrink-0">
                  <div />
                  <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">Variable</span>
                  <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">Value</span>
                  <div />
                </div>

                {/* Variables */}
                <div className="flex-1 overflow-y-auto p-4">
                  <KeyValueEditor
                    rows={selectedEnv.variables}
                    onChange={(rows) => updateEnvironment(selectedEnv.id, { variables: rows })}
                    keyPlaceholder="Variable name"
                    valuePlaceholder="Value"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
