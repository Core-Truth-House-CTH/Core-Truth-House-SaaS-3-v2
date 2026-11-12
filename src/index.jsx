import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { captureUtmsFirstTouch } from "./lib/utmCapture";
import "./index.css";
import "./styles/cth-shell-final.css";
import "./styles/cth-command-final.css";

function bootstrap() {
  // First-touch attribution capture, before React Router mounts and strips the
  // query string. Runs on every page load, public/pre-auth included.
  captureUtmsFirstTouch();

  const container = document.getElementById("root");

  if (!container) {
    throw new Error("Root element not found. Make sure index.html has a div with id='root'.");
  }

  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

bootstrap();
