import { defineConfig } from "vite";

export default defineConfig(({ mode }) => {
  const sharedConfig = { base: "" };

  if (mode === "example") {
    // Not in library mode if using `--mode example`.
    // Serves example instead.
    return sharedConfig;
  }

  return {
    ...sharedConfig,
    build: {
      sourcemap: true,
      lib: {
        entry: "./src/index.ts",
        name: "pdfgo",
        fileName: (format) => `pdfgo.${format}.js`,
      },
    },
  };
});
