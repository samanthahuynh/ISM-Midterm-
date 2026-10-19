import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { initStore } from "./data/store.js";
import "./index.css";

initStore().then(() => {
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
