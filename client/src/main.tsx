import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./App.css";
import "./styles/design-system.css";
import "leaflet/dist/leaflet.css";
import "./styles/map.css";

import App from "./App.tsx";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("PATIMATI root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);