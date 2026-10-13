import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/dev.ts"],
  format: ["esm"],
  target: "node24",
  clean: true,
  sourcemap: true,
  outDir: "dist",
  splitting: false,
  banner: {
    js: "// @ts-check",
  },
});
