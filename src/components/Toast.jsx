import { useEffect, useState, createContext, useContext, useCallback } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: { icon: CheckCircle2, color: "#86efac", bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.3)" },
  error:   { icon: XCircle,      color: "#f87171", bg: "rgba(244,63,94,0.15)", border: "rgba(244,63,94,0.3)" },
  warning: { icon: AlertTriangle, color: "#facc15", bg: "rgba(250,204,21,0.12)", border: "rgba(250,204,21,0.28)" },
  info:    { icon: Info,          color: "#60a5fa", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.28)" },
};

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);
  const config = ICONS[toast.type] || ICONS.info;
  const Icon = config.icon;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 350);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [onRemove, toast.duration, toast.id]);

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      padding: "14px 18px",
      borderRadius: 16,
      background: config.bg,
      border: `1px solid ${config.border}`,
      backdropFilter: "blur(20px)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      minWidth: 300,
      maxWidth: 420,
      transform: visible ? "translateX(0) scale(1)" : "translateX(120%) scale(0.92)",
      opacity: visible ? 1 : 0,
      transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
      cursor: "default",
    }}>
      <Icon size={20} style={{ color: config.color, flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        {toast.title && (
          <div style={{ fontWeight: 700, color: config.color, fontSize: "0.92rem", marginBottom: 2 }}>
            {toast.title}
          </div>
        )}
        <div style={{ color: "#cbd5e1", fontSize: "0.88rem", lineHeight: 1.5 }}>
          {toast.message}
        </div>
      </div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 350); }}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 2, flexShrink: 0 }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = "info", title, message, duration }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-4), { id, type, title, message, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
      }}>
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: "auto" }}>
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
