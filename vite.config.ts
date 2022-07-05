import { defineConfig } from "vite";

export default defineConfig({
  base: "",
  build: {
    sourcemap: true,
    lib: {
      entry: "./src/index.ts",
      name: "pdfgo",
      fileName: (format) => `pdfgo.${format}.js`,
    },
  },
});
