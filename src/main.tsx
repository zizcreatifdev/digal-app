import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

// Register service worker with auto-update
registerSW({
  onNeedRefresh() {
    // New content available: auto-reload in background
    // (the SW uses autoUpdate so this fires after the new SW activates)
    window.location.reload();
  },
  onOfflineReady() {
    console.info("[PWA] App is ready for offline use.");
  },
});

createRoot(document.getElementById("root")!).render(<App />);
