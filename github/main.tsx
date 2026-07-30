import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../app/globals.css";
import { EscapeExperience } from "../components/experience/EscapeExperience";

const root = document.getElementById("root");

if (!root) {
  throw new Error("ESCAPE.HTML could not find its entry point.");
}

createRoot(root).render(
  <StrictMode>
    <EscapeExperience />
  </StrictMode>,
);
