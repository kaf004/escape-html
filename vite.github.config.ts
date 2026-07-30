import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").pop();
const base =
  process.env.GITHUB_ACTIONS === "true" && repositoryName
    ? `/${repositoryName}/`
    : "/";

export default defineConfig({
  root: fileURLToPath(new URL("./github", import.meta.url)),
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  base,
  plugins: [react()],
  build: {
    outDir: `${projectRoot}dist-pages`,
    emptyOutDir: true,
  },
});
