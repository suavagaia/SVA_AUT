import React from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://lxteajwzovoeclbytdrp.supabase.co";
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dGVhand6b3ZvZWNsYnl0ZHJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzkxMzcsImV4cCI6MjA4ODkxNTEzN30.BLB9qSJcZMKsWhix46ASUbOW2lA0PSeyHN97jMQQGkQ";

export async function logError(
  type: string,
  message: string,
  details: Record<string, unknown> = {}
) {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/log-error`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON,
      },
      body: JSON.stringify({ source: "frontend", type, message, details }),
    });
  } catch (_) {
    // silencioso — não quebrar por causa do monitor
  }
}

interface ErrorBoundaryState { hasError: boolean; }

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ReactNode }>,
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logError("js_crash", error.message, {
      stack: error.stack?.slice(0, 500),
      component: info.componentStack?.slice(0, 300),
      url: window.location.pathname,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{ padding: 32, textAlign: "center" }}>
          <h2>Algo deu errado.</h2>
          <p>Recarregue a página para continuar.</p>
          <button onClick={() => window.location.reload()}>Recarregar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Captura erros globais JavaScript
if (typeof window !== "undefined") {
  window.onerror = (msg, src, line, col, err) => {
    logError("js_global_error", String(msg), {
      source: src,
      line,
      col,
      stack: err?.stack?.slice(0, 500),
      url: window.location.pathname,
    });
  };

  window.addEventListener("unhandledrejection", (event) => {
    const msg = event.reason?.message || String(event.reason) || "Unhandled promise rejection";
    logError("unhandled_rejection", msg, {
      stack: event.reason?.stack?.slice(0, 500),
      url: window.location.pathname,
    });
  });
}
