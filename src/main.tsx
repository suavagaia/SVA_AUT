import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./lib/errorMonitor";

// Capacitor — inicializa plugins nativos quando rodando no iOS
import { Capacitor } from "@capacitor/core";
if (Capacitor.isNativePlatform()) {
  Promise.all([
    import("@capacitor/splash-screen").then(({ SplashScreen }) =>
      SplashScreen.hide({ fadeOutDuration: 300 })
    ),
    import("@capacitor/status-bar").then(({ StatusBar, Style }) =>
      StatusBar.setStyle({ style: Style.Dark })
    ),
  ]).catch(() => {/* silencioso — evita crash no simulador */});
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
