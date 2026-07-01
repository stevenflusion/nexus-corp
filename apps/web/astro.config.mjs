// @ts-check

import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import node from "@astrojs/node"

const isStaticBuild =
  process.env.BUILD_TARGET === "static" || process.env.ASTRO_OUTPUT === "static"

// https://astro.build/config
export default defineConfig({
  output: isStaticBuild ? "static" : "server",
  ...(isStaticBuild
    ? {}
    : {
        adapter: node({
          mode: "standalone",
        }),
      }),
  devToolbar: {
    enabled: false,
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react()],
})
