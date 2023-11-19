import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 9099,
  },
  plugins: [
    vue(),
    VitePWA({
      injectRegister: "auto",
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
      manifest: {
        background_color: "#7e22ce",
        lang: "fr",
        name: "Afreekaplay",
        short_name: "Afreekaplay",
        icons: [ {
          src: "icons/icon.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable any",
        },],
      },
    }),
  ],
});
