import { bundle } from "./bundler/bundler.ts";
import path from "node:path";
import { colons, fsResolve, virtual } from "./bundler/plugins.ts";

await bundle({
  entrypoints: [path.join(import.meta.dirname!, "fixture", "foo.ts")],
  outDir: path.join(import.meta.dirname!, "dist"),
  plugins: [virtual(), colons(), fsResolve()],
});
