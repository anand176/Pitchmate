import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            // Proxy all /api calls to FastAPI backend in development
            "/auth": {
                target: "http://localhost:8000",
                changeOrigin: true,
            },
            "/agents": {
                target: "http://localhost:8000",
                changeOrigin: true,
            },
            "/knowledge-base": {
                target: "http://localhost:8000",
                changeOrigin: true,
            },
            "/health": {
                target: "http://localhost:8000",
                changeOrigin: true,
            },
        },
    },
});
