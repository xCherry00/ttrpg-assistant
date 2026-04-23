import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application render error:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            background: "#08111b",
            color: "#edf4ff",
            fontFamily: "\"Trebuchet MS\", \"Segoe UI\", sans-serif",
          }}
        >
          <div
            style={{
              width: "min(760px, 100%)",
              border: "1px solid rgba(154, 193, 221, 0.18)",
              borderRadius: "20px",
              background: "rgba(18, 31, 48, 0.92)",
              padding: "24px",
              boxShadow: "0 18px 46px rgba(0, 0, 0, 0.34)",
            }}
          >
            <div style={{ color: "#d7a857", fontSize: "12px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "12px" }}>
              Frontend error
            </div>
            <h1 style={{ margin: "0 0 12px", fontFamily: "\"Palatino Linotype\", Georgia, serif" }}>
              Aplikacja wywaliła się podczas renderowania
            </h1>
            <p style={{ margin: "0 0 16px", lineHeight: 1.7, color: "rgba(226, 236, 248, 0.76)" }}>
              Zamiast białej strony pokazuję rzeczywisty błąd. Odśwież stronę, a jeśli ten ekran się pojawi,
              podeślij treść poniżej.
            </p>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                padding: "16px",
                borderRadius: "14px",
                background: "rgba(7, 13, 20, 0.9)",
                border: "1px solid rgba(154, 193, 221, 0.18)",
                color: "#f7d0d7",
              }}
            >
              {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
