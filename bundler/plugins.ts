import { Plugin } from "./bundler.ts";
import path from "node:path";

export function fsResolve(): Plugin {
  return {
    name: "default-plugin",
    resolve(id, referrer) {
      // JS Specifiers:
      // - ./foo.ts
      // - ../foo.ts
      if (id.startsWith("./") || id.startsWith("../")) {
        // Cannot resolve without referrer
        if (referrer === null) return;

        if (!path.isAbsolute(referrer)) {
          referrer = Deno.cwd();
        }

        return `${path.join(path.dirname(referrer), id)}`;
      } else if (path.isAbsolute(id)) {
        return `${id}`;
      }
    },
    async load(id) {
      if (path.isAbsolute(id)) {
        return await Deno.readTextFile(id);
      }
    },
  };
}

export function virtual(): Plugin {
  return {
    name: "virtual-plugin",
    resolve(id) {
      if (id === "virtual-module") {
        return `virtual-module`;
      }
    },
    load(id) {
      if (id !== "virtual-module") return;

      return `export const virtual = "virtual";`;
    },
  };
}

export function colons(): Plugin {
  return {
    name: "colons-plugin",
    resolve(id) {
      if (id === ":::") {
        return `:::`;
      }
    },
    load(id) {
      if (id !== ":::") return;

      return `export const colons = ":::";`;
    },
  };
}
