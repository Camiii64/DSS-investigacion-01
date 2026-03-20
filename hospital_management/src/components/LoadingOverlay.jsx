function LoadingOverlay({ visible, message = "Procesando..." }) {
  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(15, 23, 42, 0.45)",
      backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999,
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "40px 56px",
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: "20px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
      }}>
        <svg
          width="72" height="72" viewBox="0 0 72 72"
          style={{ animation: "lottie-spin 1s linear infinite", transformOrigin: "center" }}
        >
          <circle cx="36" cy="36" r="28" fill="none" stroke="#B2E5E8" strokeWidth="7" />
          <circle
            cx="36" cy="36" r="28"
            fill="none"
            stroke="#006B76"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="52 124"
            strokeDashoffset="0"
          />
          <style>{`
            @keyframes lottie-spin {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
          `}</style>
        </svg>

        <p style={{
          fontSize: "14px", fontWeight: "600",
          color: "#374151", fontFamily: "Inter, sans-serif",
          margin: 0,
        }}>
          {message}
        </p>
      </div>
    </div>
  );
}

export default LoadingOverlay;
