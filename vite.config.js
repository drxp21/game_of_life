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
      
      registerSWPrompt: (outdatedRegistration, { navigate }) => {
        if (
          confirm(
            "Une nouvelle version de l'application est disponible. Souhaitez-vous la mettre à jour ?"
          )
        ) {
          outdatedRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
          navigate(outdatedRegistration.waiting);
        }
      },
      registerType: "prompt",
      devOptions: {
        enabled: true,
      },
      manifest: {
        background_color: "#7e22ce",
        lang: "fr",
        name: "The Game of Life ",
        short_name: "Game of Life",
        icons: [
          {
            src: "icons/icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable any",
          },
        ],
      },
    }),
  ],
});
