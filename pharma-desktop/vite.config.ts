import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// Tauri attend un frontend servi sur un port fixe. Le serveur écoute sur
// toutes les interfaces pour que l'aperçu distant puisse le détecter.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    host: true,
    port: 3000,
    strictPort: false,
    // Autorise l'hôte de l'aperçu distant (sandbox v0/Vercel).
    allowedHosts: true,
  },
  build: {
    target: "es2021",
    outDir: "dist",
  },
})
