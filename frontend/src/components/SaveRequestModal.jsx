import { useState } from "react";
import { useAppState } from "../context/AppStateContext";

export default function SaveRequestModal({ requestDraft, onClose, onSaved }) {
  const { collections, createCollection, saveRequestToCollection } = useAppState();
  const [requestName, setRequestName] = useState(requestDraft.name || "");
  const [selectedCollectionId, setSelectedCollectionId] = useState(collections[0]?.id || "");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [mode, setMode] = useState(collections.length ? "existing" : "new");

  function handleSave(e) {
    e.preventDefault();
    if (!requestName.trim()) return;

    let targetCollectionId = selectedCollectionId;
    let collectionName = collections.find((c) => c.id === selectedCollectionId)?.name || "";

    if (mode === "new") {
      if (!newCollectionName.trim()) return;
      const created = createCollection(newCollectionName.trim());
      targetCollectionId = created.id;
      collectionName = created.name;
    }
    if (!targetCollectionId) return;

    saveRequestToCollection(
      targetCollectionId,
      { ...requestDraft, name: requestName.trim() },
      requestDraft.id
    );
    onSaved(`Saved "${requestName.trim()}" to ${collectionName}`);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        onSubmit={handleSave}
        className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 w-[420px] flex flex-col gap-4 shadow-2xl"
      >
        <div>
          <h3 className="text-sm font-semibold text-neutral-100">Save Request</h3>
          <p className="text-xs text-neutral-600 mt-0.5">Add this request to a collection</p>
        </div>

        {/* Request name */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-500">Request name</label>
          <input
            autoFocus
            type="text"
            value={requestName}
            onChange={(e) => setRequestName(e.target.value)}
            placeholder="e.g. Get all recipes"
            className="bg-neutral-800 border border-neutral-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none placeholder-neutral-600 transition-colors"
          />
        </div>

        {/* Collection mode toggle */}
        <div className="flex gap-1 bg-neutral-800 border border-neutral-700 rounded-lg p-1">
          {[
            { id: "existing", label: "Existing", disabled: collections.length === 0 },
            { id: "new",      label: "New collection", disabled: false },
          ].map(({ id, label, disabled }) => (
            <label
              key={id}
              className={`flex-1 text-center text-xs px-3 py-1.5 rounded-md transition-colors select-none ${
                mode === id
                  ? "bg-neutral-700 text-neutral-100 cursor-default"
                  : disabled
                  ? "text-neutral-700 cursor-not-allowed"
                  : "text-neutral-500 hover:text-neutral-300 cursor-pointer"
              }`}
            >
              <input
                type="radio"
                className="hidden"
                checked={mode === id}
                onChange={() => !disabled && setMode(id)}
              />
              {label}
            </label>
          ))}
        </div>

        {/* Collection selector or new name input */}
        {mode === "existing" ? (
          <select
            value={selectedCollectionId}
            onChange={(e) => setSelectedCollectionId(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none transition-colors"
          >
            {collections.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="Collection name"
            className="bg-neutral-800 border border-neutral-700 focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-neutral-100 focus:outline-none placeholder-neutral-600 transition-colors"
          />
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-200 transition-colors rounded-lg hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
