import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { registerPwaServiceWorker } from "./app/registerPwaServiceWorker";
import "./styles/global.css";

const applicationRoot = document.getElementById("root");

if (!applicationRoot) {
  throw new Error("Padelito necesita un elemento root para iniciar React.");
}

createRoot(applicationRoot).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerPwaServiceWorker();
