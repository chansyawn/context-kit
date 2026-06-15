import { App } from "@/app/app";
import { initializePreferencesRuntime } from "@/features/preferences/preferences-runtime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@/global.css";

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Root element #app was not found.");
}

initializePreferencesRuntime();

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
