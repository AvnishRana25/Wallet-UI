import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import rollupNodePolyFill from "rollup-plugin-node-polyfills";
// import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'; // Keep removed for now
// import rollupNodePolyFill from 'rollup-plugin-node-polyfills'; // Keep removed for now, focus on dev server

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",
    // 'process.env': JSON.stringify({}), // If you need process.env, define it as an empty object or specific vars
  },
  resolve: {
    alias: {
      // Keeping stream and events aliases as they might be needed by other parts of solana libs
      stream: "rollup-plugin-node-polyfills/polyfills/stream",
      events: "rollup-plugin-node-polyfills/polyfills/events",
      // Buffer is aliased by rollup-plugin-node-polyfills itself or can be aliased to 'buffer' module
      // The plugin should handle Buffer, but if issues persist, explicit alias can be re-added.
      // buffer: "buffer/", // This might be redundant if rollupNodePolyFill handles it well.
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true, // For dev server and dependency pre-bundling
        }),
        // NodeModulesPolyfillPlugin(), // Keep removed
      ],
    },
  },
  build: {
    rollupOptions: {
      plugins: [
        // Enable rollup polyfills plugin
        // used during production bundling
        rollupNodePolyFill(),
      ],
    },
  },
});
