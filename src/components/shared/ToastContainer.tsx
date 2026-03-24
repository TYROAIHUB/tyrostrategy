import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { useToastStore, type Toast, type ToastType } from "@/stores/toastStore";

const DEFAULT_DURATION = 4000;

const iconMap: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styleMap: Record<ToastType, { bg: string; icon: string; bar: string; border: string }> = {
  success: {
    bg: "bg-tyro-surface",
    icon: "text-emerald-500",
    bar: "bg-emerald-500",
    border: "border-emerald-100",
  },
  error: {
    bg: "bg-tyro-surface",
    icon: "text-red-500",
    bar: "bg-red-500",
    border: "border-red-100",
  },
  warning: {
    bg: "bg-tyro-surface",
    icon: "text-amber-500",
    bar: "bg-amber-500",
    border: "border-amber-100",
  },
  info: {
    bg: "bg-tyro-surface",
    icon: "text-blue-500",
    bar: "bg-blue-500",
    border: "border-blue-100",
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const duration = toast.duration ?? DEFAULT_DURATION;
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const expiredRef = useRef(false);

  const dismiss = useCallback(() => removeToast(toast.id), [removeToast, toast.id]);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 50;
        if (next >= duration && !expiredRef.current) {
          expiredRef.current = true;
          clearInterval(interval);
          setTimeout(dismiss, 0);
        }
        return Math.min(next, duration);
      });
    }, 50);
    return () => clearInterval(interval);
  }, [paused, duration, dismiss]);

  const progress = Math.max(0, 1 - elapsed / duration);
  const Icon = iconMap[toast.type];
  const style = styleMap[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`relative w-[360px] ${style.bg} rounded-xl border ${style.border} shadow-lg shadow-black/5 overflow-hidden pointer-events-auto`}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Animated icon */}
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.15 }}
          className="shrink-0 mt-0.5"
        >
          <Icon size={20} className={style.icon} />
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-tyro-text-primary leading-snug">
            {toast.title}
          </p>
          {toast.message && (
            <p className="text-[12px] text-tyro-text-secondary mt-0.5 leading-relaxed">
              {toast.message}
            </p>
          )}
          {toast.details && toast.details.length > 0 && (
            <div className="mt-1.5 flex flex-col gap-0.5">
              {toast.details.map((d, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px] leading-snug">
                  <span className="text-tyro-text-muted shrink-0">{d.label}:</span>
                  <span className="font-medium text-tyro-text-primary truncate">{d.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={dismiss}
          className="shrink-0 p-0.5 rounded-md hover:bg-tyro-bg transition-colors cursor-pointer"
        >
          <X size={14} className="text-tyro-text-muted" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-[3px] w-full bg-tyro-bg">
        <motion.div
          className={`h-full ${style.bar} origin-left`}
          style={{ scaleX: progress }}
          transition={{ duration: 0 }}
        />
      </div>
    </motion.div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="fixed top-4 right-4 z-[80] flex flex-col gap-2.5 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
