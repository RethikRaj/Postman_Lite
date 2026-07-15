import { useState } from "react";
import { AppStateProvider, useAppState } from "./context/AppStateContext";
import Sidebar from "./components/Sidebar";
import RequestBuilder, { emptyDraft } from "./components/RequestBuilder";
import EnvironmentPanel from "./components/EnvironmentPanel";

function AppShell() {
  const { activeEnv, collections } = useAppState();
  const [draft, setDraft] = useState(emptyDraft());
  const [activeCollectionId, setActiveCollectionId] = useState(null);
  const [showEnvPanel, setShowEnvPanel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const activeCollection = collections?.find((c) => c.id === activeCollectionId) ?? null;

  function handleSelectRequest(collectionId, request) {
    setActiveCollectionId(collectionId);
    setDraft({
      ...request,
      headers: request.headers?.length ? request.headers : [{ key: "", value: "", enabled: true }],
      formFields: request.formFields?.length ? request.formFields : [{ key: "", value: "", enabled: true }],
      params: request.params?.length ? request.params : [{ key: "", value: "", enabled: true }],
    });
  }

  function handleNewRequest() {
    setActiveCollectionId(null);
    setDraft(emptyDraft());
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-950 text-neutral-100">
      {/* ── Top header bar ── */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 shrink-0 bg-neutral-900">
        {/* Left: sidebar toggle + logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-500 hover:text-neutral-200 transition-colors"
            title="Toggle sidebar"
          >
            {/* hamburger */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6"  x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="text-orange-500 font-bold text-sm tracking-wide select-none">
            Easy Request
          </span>
        </div>

        {/* Right: new request + environment */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewRequest}
            className="flex items-center gap-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-3 py-1.5 rounded-md text-neutral-200 transition-colors"
          >
            <span className="text-orange-400 font-bold text-sm leading-none">+</span>
            New Request
          </button>
          <button
            onClick={() => setShowEnvPanel(true)}
            className="flex items-center gap-2 text-xs bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-3 py-1.5 rounded-md transition-colors"
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeEnv ? "bg-orange-500" : "bg-neutral-600"}`} />
            <span className="text-neutral-300">Environment : {activeEnv ? activeEnv.name : "No Environment"}</span>
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <Sidebar onSelectRequest={handleSelectRequest} activeRequestId={draft.id} />
        )}
        <RequestBuilder draft={draft} setDraft={setDraft} collectionId={activeCollectionId} activeCollection={activeCollection} />
      </div>

      {showEnvPanel && <EnvironmentPanel onClose={() => setShowEnvPanel(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppShell />
    </AppStateProvider>
  );
}
