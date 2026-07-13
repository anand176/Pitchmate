import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Locally the backend is at localhost:8000. Inside Docker Compose the
// frontend container reaches it via the service name instead, so
// docker-compose.yml overrides this with VITE_PROXY_TARGET=http://backend:8000.
const BACKEND_TARGET = process.env.VITE_PROXY_TARGET || "http://localhost:8000";

export default defineConfig({
    plugins: [react()],
    server: {
        host: true, // listen on 0.0.0.0 so the Docker port mapping works
        port: 5173,
        strictPort: true,
        watch: {
            // Docker bind mounts (especially on Windows/macOS) don't always
            // emit native fs events, so fall back to polling for reliable HMR.
            usePolling: true,
        },
        proxy: {
            // Proxy all /api calls to FastAPI backend in development
            "/auth": {
                target: BACKEND_TARGET,
                changeOrigin: true,
            },
            "/agents": {
                target: BACKEND_TARGET,
                changeOrigin: true,
            },
            "/knowledge-base": {
                target: BACKEND_TARGET,
                changeOrigin: true,
            },
            "/dashboard": {
                target: BACKEND_TARGET,
                changeOrigin: true,
            },
            "/startup": {
                target: BACKEND_TARGET,
                changeOrigin: true,
            },
            "/health": {
                target: BACKEND_TARGET,
                changeOrigin: true,
            },
        },
    },
});
