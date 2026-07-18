import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { useCallback, useEffect, useReducer, useRef, type ReactNode } from "react";
import { ToastContext } from "./context";
import type { ToastInput, ToastItem, ToastTone } from "./types";
import { createToastItem, toastReducer } from "./utils";

const TONE_STYLES: Record<ToastTone, { accent: string; icon: typeof Info }> = {
  success: { accent: "border-emerald-400/25 text-emerald-300", icon: CircleCheck },
  error: { accent: "border-red-400/25 text-red-300", icon: CircleAlert },
  warning: { accent: "border-amber-300/25 text-amber-200", icon: TriangleAlert },
  info: { accent: "border-sky-300/25 text-sky-200", icon: Info },
};

function getToastDuration(toast: ToastItem) {
  return toast.durationMs ?? (toast.tone === "error" ? 7_000 : 4_500);
}

function createToastId() {
  return globalThis.crypto?.randomUUID?.() ?? `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) clearTimeout(timer);
    timersRef.current.delete(id);
    dispatch({ type: "dismiss", id });
  }, []);

  const notify = useCallback((input: ToastInput | string) => {
    const toast = createToastItem(input, createToastId());
    dispatch({ type: "add", toast });
    timersRef.current.set(toast.id, setTimeout(() => dismiss(toast.id), getToastDuration(toast)));
    return toast.id;
  }, [dismiss]);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  return (
    <ToastContext.Provider value={{ dismiss, notify }}>
      {children}
      <div aria-live="polite" aria-relevant="additions" className="pointer-events-none fixed bottom-5 right-5 z-[250] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => {
          const tone = TONE_STYLES[toast.tone];
          const Icon = tone.icon;

          return (
            <div key={toast.id} role={toast.tone === "error" ? "alert" : "status"} aria-atomic="true" className={`animate-toast-in pointer-events-auto flex gap-3 rounded-xl border bg-[#1c1c20]/95 p-4 shadow-[0_18px_55px_rgba(0,0,0,0.55)] backdrop-blur-xl ${tone.accent}`}>
              <Icon size={18} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-neutral-100">{toast.title}</p>
                <p className="mt-1 text-xs leading-5 text-neutral-400">{toast.message}</p>
              </div>
              <button type="button" onClick={() => dismiss(toast.id)} aria-label="Fechar notificação" className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-600 transition hover:bg-white/5 hover:text-neutral-200">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
