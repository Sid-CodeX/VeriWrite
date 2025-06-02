// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000, // <--- Set frontend dev server to a different port (e.g., 3000, 5173, or any free port)
    proxy: {
      '/api': { // When your frontend makes a request to a path starting with /api
        target: 'http://localhost:5000', // <--- IMPORTANT: Point to your backend server's actual port (5000)
        changeOrigin: true, // Needed for proper routing
      },
      // If you have direct requests for /uploads from the frontend via Vite, add this:
      '/uploads': {
        target: 'http://localhost:5000', // <--- IMPORTANT: Point to your backend server's actual port (5000)
        changeOrigin: true,
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));