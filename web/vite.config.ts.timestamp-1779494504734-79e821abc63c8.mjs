// vite.config.ts
import { defineConfig } from "file:///C:/Users/caune/OneDrive/Documents/detrones/front/node_modules/.pnpm/vite@5.4.21/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Users/caune/OneDrive/Documents/detrones/front/node_modules/.pnpm/@vitejs+plugin-vue@5.2.4_vite@5.4.21_vue@3.5.29_typescript@5.9.3_/node_modules/@vitejs/plugin-vue/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [vue()],
  server: {
    allowedHosts: true,
    proxy: {
      // Backend Nuxt API
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true
      },
      // ── Colyseus game server ─────────────────────────────────────────
      // All Colyseus traffic goes through the /colyseus prefix.
      // Vite strips the prefix and forwards to the game server.
      //
      //   HTTP matchmake : /colyseus/matchmake/… → localhost:2567/matchmake/…
      //   Room WebSocket : /colyseus/<roomId>?…  → localhost:2567/<roomId>?…
      //   Local rooms    : /rooms, /roomByCode   → localhost:2567/…
      "/colyseus": {
        target: "http://localhost:2567",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/colyseus/, "")
      },
      // Custom REST endpoints (room list & code lookup)
      "/rooms": {
        target: "http://localhost:2567",
        changeOrigin: true
      },
      "/roomByCode": {
        target: "http://localhost:2567",
        changeOrigin: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxjYXVuZVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudHNcXFxcZGV0cm9uZXNcXFxcZnJvbnRcXFxcd2ViXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxjYXVuZVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudHNcXFxcZGV0cm9uZXNcXFxcZnJvbnRcXFxcd2ViXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9jYXVuZS9PbmVEcml2ZS9Eb2N1bWVudHMvZGV0cm9uZXMvZnJvbnQvd2ViL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gICAgcGx1Z2luczogW3Z1ZSgpXSxcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICAgIGFsbG93ZWRIb3N0czogdHJ1ZSxcclxuICAgICAgICBwcm94eToge1xyXG4gICAgICAgICAgICAvLyBCYWNrZW5kIE51eHQgQVBJXHJcbiAgICAgICAgICAgICcvYXBpJzoge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDozMDAwJyxcclxuICAgICAgICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIC8vIFx1MjUwMFx1MjUwMCBDb2x5c2V1cyBnYW1lIHNlcnZlciBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuICAgICAgICAgICAgLy8gQWxsIENvbHlzZXVzIHRyYWZmaWMgZ29lcyB0aHJvdWdoIHRoZSAvY29seXNldXMgcHJlZml4LlxyXG4gICAgICAgICAgICAvLyBWaXRlIHN0cmlwcyB0aGUgcHJlZml4IGFuZCBmb3J3YXJkcyB0byB0aGUgZ2FtZSBzZXJ2ZXIuXHJcbiAgICAgICAgICAgIC8vXHJcbiAgICAgICAgICAgIC8vICAgSFRUUCBtYXRjaG1ha2UgOiAvY29seXNldXMvbWF0Y2htYWtlL1x1MjAyNiBcdTIxOTIgbG9jYWxob3N0OjI1NjcvbWF0Y2htYWtlL1x1MjAyNlxyXG4gICAgICAgICAgICAvLyAgIFJvb20gV2ViU29ja2V0IDogL2NvbHlzZXVzLzxyb29tSWQ+P1x1MjAyNiAgXHUyMTkyIGxvY2FsaG9zdDoyNTY3Lzxyb29tSWQ+P1x1MjAyNlxyXG4gICAgICAgICAgICAvLyAgIExvY2FsIHJvb21zICAgIDogL3Jvb21zLCAvcm9vbUJ5Q29kZSAgIFx1MjE5MiBsb2NhbGhvc3Q6MjU2Ny9cdTIwMjZcclxuICAgICAgICAgICAgJy9jb2x5c2V1cyc6IHtcclxuICAgICAgICAgICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MjU2NycsXHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgICAgICAgICB3czogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9jb2x5c2V1cy8sICcnKSxcclxuICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIC8vIEN1c3RvbSBSRVNUIGVuZHBvaW50cyAocm9vbSBsaXN0ICYgY29kZSBsb29rdXApXHJcbiAgICAgICAgICAgICcvcm9vbXMnOiB7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjI1NjcnLFxyXG4gICAgICAgICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAnL3Jvb21CeUNvZGUnOiB7XHJcbiAgICAgICAgICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjI1NjcnLFxyXG4gICAgICAgICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICB9LFxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQThWLFNBQVMsb0JBQW9CO0FBQzNYLE9BQU8sU0FBUztBQUVoQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUN4QixTQUFTLENBQUMsSUFBSSxDQUFDO0FBQUEsRUFDZixRQUFRO0FBQUEsSUFDSixjQUFjO0FBQUEsSUFDZCxPQUFPO0FBQUE7QUFBQSxNQUVILFFBQVE7QUFBQSxRQUNKLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFTQSxhQUFhO0FBQUEsUUFDVCxRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxJQUFJO0FBQUEsUUFDSixTQUFTLENBQUMsU0FBUyxLQUFLLFFBQVEsZUFBZSxFQUFFO0FBQUEsTUFDckQ7QUFBQTtBQUFBLE1BR0EsVUFBVTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2xCO0FBQUEsTUFDQSxlQUFlO0FBQUEsUUFDWCxRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDbEI7QUFBQSxJQUNKO0FBQUEsRUFDSjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
