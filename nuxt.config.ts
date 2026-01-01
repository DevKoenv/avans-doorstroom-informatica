import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  modules: ["@nuxtjs/i18n", "nuxt-auth-utils"],
  components: [
    { path: "~/components/ui", pathPrefix: false },
    "~/components"
  ],
  i18n: {
    baseUrl: process.env.NUXT_BASE_URL || "http://localhost:3000",
    defaultLocale: "en",
    locales: [{ code: "en", language: "en-US", name: "English", file: "en.json" }],
  },
  runtimeConfig: {
    public: {
      appUrl: process.env.NUXT_BASE_URL || "http://localhost:3000",
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  css: ["~/assets/css/globals.css"],
});
