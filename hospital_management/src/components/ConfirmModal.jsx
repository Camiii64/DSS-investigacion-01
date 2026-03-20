function ConfirmModal({ visible, message, onConfirm, onCancel, confirmLabel = "Eliminar", danger = true }) {
  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(15, 23, 42, 0.45)",
      backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10000,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "32px 36px",
        maxWidth: "420px",
        width: "90%",
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        fontFamily: "Inter, sans-serif",
      }}>
        <div style={{
          width: "52px", height: "52px", borderRadius: "14px",
          background: danger ? "#fef2f2" : "#E0F5F7",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: "16px",
        }}>
          <span className="material-symbols-outlined" style={{ color: danger ? "#ef4444" : "#006B76", fontSize: "26px" }}>
            {danger ? "delete_forever" : "help"}
          </span>
        </div>

        <p style={{ fontSize: "15px", fontWeight: "600", color: "#111827", margin: "0 0 6px 0" }}>
          ¿Estás seguro?
        </p>
        <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 28px 0", lineHeight: "1.5" }}>
          {message}
        </p>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 20px", borderRadius: "10px", border: "1px solid #e5e7eb",
              background: "#fff", color: "#374151", fontSize: "13px", fontWeight: "600",
              cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 20px", borderRadius: "10px", border: "none",
              background: danger ? "#ef4444" : "#006B76",
              color: "#fff", fontSize: "13px", fontWeight: "700",
              cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
