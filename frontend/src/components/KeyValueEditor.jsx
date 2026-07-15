export default function KeyValueEditor({ rows, onChange, keyPlaceholder = "Key", valuePlaceholder = "Value" }) {
  const safeRows = rows.length ? rows : [{ key: "", value: "", enabled: true }];

  function updateRow(index, field, value) {
    onChange(safeRows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function removeRow(index) {
    const next = safeRows.filter((_, i) => i !== index);
    onChange(next.length ? next : [{ key: "", value: "", enabled: true }]);
  }

  function addRow() {
    onChange([...safeRows, { key: "", value: "", enabled: true }]);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {safeRows.map((row, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 transition-opacity ${!row.enabled ? "opacity-40" : ""}`}
        >
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(e) => updateRow(i, "enabled", e.target.checked)}
            className="accent-orange-500 shrink-0 w-3.5 h-3.5 cursor-pointer"
          />
          <input
            type="text"
            placeholder={keyPlaceholder}
            value={row.key}
            onChange={(e) => updateRow(i, "key", e.target.value)}
            className={`flex-1 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 focus:border-orange-500 rounded-md px-3 py-1.5 text-xs text-neutral-200 font-mono focus:outline-none transition-colors placeholder-neutral-700 ${
              !row.enabled ? "line-through text-neutral-600" : ""
            }`}
          />
          <input
            type="text"
            placeholder={valuePlaceholder}
            value={row.value}
            onChange={(e) => updateRow(i, "value", e.target.value)}
            className={`flex-1 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 focus:border-orange-500 rounded-md px-3 py-1.5 text-xs text-neutral-200 font-mono focus:outline-none transition-colors placeholder-neutral-700 ${
              !row.enabled ? "line-through text-neutral-600" : ""
            }`}
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            className="p-1 rounded text-neutral-600 hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
            title="Remove row"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="mt-1 self-start flex items-center gap-1 text-xs text-neutral-600 hover:text-orange-400 border border-dashed border-neutral-800 hover:border-orange-500/40 rounded-md px-3 py-1 transition-colors"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add
      </button>
    </div>
  );
}
