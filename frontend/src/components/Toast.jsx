import { useEffect } from "react";

/**
 * A small auto-dismissing notification that slides up from the bottom-right.
 * Props:
 *   message   - string to display
 *   type      - "success" | "error"  (default "success")
 *   duration  - ms before auto-dismiss (default 3000)
 *   onDismiss - called when dismissed (by timer or × button)
 */
export default function Toast({ message, type = "success", duration = 3000, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  const isSuccess = type === "success";

  return (
    <div className="fixed bottom-6 right-6 z-[200] toast-enter">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl ${
        isSuccess
          ? "bg-neutral-900 border-emerald-800/50"
          : "bg-neutral-900 border-red-800/50"
      }`}>
        {/* Dot indicator */}
        <span className={`w-2 h-2 rounded-full shrink-0 ${isSuccess ? "bg-emerald-500" : "bg-red-500"}`} />

        {/* Message */}
        <p className="text-sm text-neutral-200 pr-2">{message}</p>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="text-neutral-600 hover:text-neutral-300 transition-colors shrink-0"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
