import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { nodePolyfills } from "vite-plugin-node-polyfills";
// import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'; // Keep removed for now
// import rollupNodePolyFill from 'rollup-plugin-node-polyfills'; // Keep removed for now, focus on dev server

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(),
    // Options (optional):
    // To exclude specific polyfills, add them to this list.
    // By default, all available polyfills from `vite-plugin-node-polyfills` are included.
    // { exclude: ['fs'] }
    //
    // To specify whether to polyfill `global` and `process` or not.
    // {
    //   global: true, // Default: true
    //   process: true, // Default: true
    //   buffer: true, // Default: true (though NodeGlobalsPolyfillPlugin also handles this)
    // }
    //
    // Whether to polyfill specific globals.
    // {
    //   globals: {
    //     Buffer: true, // Default: true
    //     global: true, // Default: true
    //     process: true, // Default: true
    //   }
    // }
    //
    // Whether to polyfill `node:` protocol imports.
    // { protocolImports: true } // Default: true
  ],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      // stream: "rollup-plugin-node-polyfills/polyfills/stream", // Removed
      // events: "rollup-plugin-node-polyfills/polyfills/events", // Removed
      buffer: "buffer/", // Keep buffer alias, might be necessary
      // Consider adding other aliases if specific issues arise, e.g.
      // 'crypto': 'crypto-browserify',
      // 'util': 'util'
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
          buffer: true,
        }),
        // NodeModulesPolyfillPlugin(), // Keep removed
      ],
    },
    include: ["buffer", "@metaplex-foundation/umi-bundle-defaults"], // Explicitly include buffer and @metaplex-foundation/umi-bundle-defaults
  },
  build: {
    rollupOptions: {
      external: [], // Make sure @metaplex-foundation/umi-bundle-defaults is NOT listed here
      // plugins: [
      //   // rollupNodePolyFill() // If you use this, ensure it's configured correctly
      // ]
    },
  },
});
