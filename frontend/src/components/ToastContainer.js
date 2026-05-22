import React from "react";

export default function ToastContainer({ toasts, removeToast }) {
  if (!toasts.length) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}>
      {toasts.map(toast => (
        <div key={toast.id} onClick={() => removeToast(toast.id)} style={{
          padding: "12px 18px",
          borderRadius: "10px",
          fontSize: "0.9rem",
          fontWeight: "500",
          cursor: "pointer",
          minWidth: "260px",
          maxWidth: "360px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          animation: "slideIn 0.3s ease",
          background: toast.type === "success"
            ? "rgba(16,185,129,0.15)"
            : toast.type === "error"
            ? "rgba(239,68,68,0.15)"
            : "rgba(59,130,246,0.15)",
          border: `1px solid ${
            toast.type === "success" ? "#10b981"
            : toast.type === "error" ? "#ef4444"
            : "#3b82f6"
          }`,
          color: toast.type === "success" ? "#10b981"
            : toast.type === "error" ? "#ef4444"
            : "#3b82f6",
        }}>
          <span>{
            toast.type === "success" ? "✅"
            : toast.type === "error" ? "❌"
            : "ℹ️"
          }</span>
          <span style={{ flex: 1 }}>{toast.message}</span>
          <span style={{ opacity: 0.6, fontSize: "0.8rem" }}>✕</span>
        </div>
      ))}
    </div>
  );
}
