import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
// import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'; // Keep removed for now
// import rollupNodePolyFill from 'rollup-plugin-node-polyfills'; // Keep removed for now, focus on dev server

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      // Keeping stream and events aliases as they might be needed by other parts of solana libs
      stream: "rollup-plugin-node-polyfills/polyfills/stream",
      events: "rollup-plugin-node-polyfills/polyfills/events",
      buffer: "buffer/",
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
          buffer: true, // Reinstate buffer polyfill here for pre-bundling
        }),
        // NodeModulesPolyfillPlugin(), // Keep removed
      ],
    },
  },
  // build: { // Keep build section commented for now to isolate dev server issues
  //   rollupOptions: {
  //     plugins: [
  //       rollupNodePolyFill()
  //     ]
  //   }
  // }
});
