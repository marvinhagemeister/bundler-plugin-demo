import * as logger from "./logger.ts";

export interface Plugin {
  name: string;
  resolve?(
    specifier: string,
    referrer: string | null
  ): void | string | Promise<void | string>;
  load?(specifier: string): string | void | Promise<string | void>;
}

export interface BundleOptions {
  entrypoints: string[];
  plugins: Plugin[];
  outDir: string;
}

export interface ResolveReq {
  referrer: string | null;
  id: string;
}

const IMPORT_REG = /^import\s+(\w+|\{.*?\})\s+from\s+["']([^"']+)["'];?\n+?/gm;

type ResolveCache = Map<string, string>;
type Graph = Map<string, { code: string; deps: string[] }>;

export async function bundle(options: BundleOptions): Promise<void> {
  const cache: ResolveCache = new Map();
  const graph: Graph = new Map();

  for (const entry of options.entrypoints) {
    // Recursively resolve and load modules as we discover them.
    await resolveAndLoad(graph, cache, options.plugins, entry, null);
  }

  // Everything has been resolved and loaded, let's actually bundle code.
  // For demonstration purposes we won't do any real bundling and just
  // concatenate all modules together in order. Every entrypoint gets its
  // own bundle. There is no chunking either.

  for (let i = 0; i < options.entrypoints.length; i++) {
    const entry = options.entrypoints[i];
    logger.logBundlingEntry(entry);

    const resolved = cache.get(entry)!;
    const sorted = topoSort(graph, resolved);

    let bundle = "";
    for (const id of sorted) {
      const mod = graph.get(id)!;
      bundle += `// Module: ${id}\n${mod.code}\n\n`;
    }

    bundle = bundle
      .replaceAll(/\n[\n]+/g, "\n\n")
      .replaceAll(/^export\s(const|let|var)/gm, "$1")
      .replace(/\n+$/, "\n");

    console.log(bundle);
  }

  logger.logFinished();
}

async function resolveAndLoad(
  graph: Graph,
  cache: ResolveCache,
  plugins: Plugin[],
  id: string,
  referrer: string | null
): Promise<string> {
  const resolved = await resolvePlugins(plugins, id, referrer);
  if (!resolved) throw new Error(`Could not resolve ${id}`);

  cache.set(id, resolved);

  for (const plugin of plugins) {
    if (plugin.load) {
      let content = await plugin.load(resolved);
      if (content) {
        logger.logLoaded(plugin.name, resolved, content);

        // Get potential new specifiers to resolve
        // We'll only do static imports for now
        const deps: string[] = [];
        for (const match of content.matchAll(IMPORT_REG)) {
          const depId = match[2];

          const depResolved = await resolveAndLoad(
            graph,
            cache,
            plugins,
            depId,
            resolved
          );

          deps.push(depResolved);
        }

        content = content.replaceAll(IMPORT_REG, "");

        graph.set(resolved, { code: content, deps });

        break;
      } else {
        logger.logNoLoad(plugin.name, resolved);
      }
    }
  }

  return resolved;
}

async function resolvePlugins(
  plugins: Plugin[],
  id: string,
  referrer: string | null
): Promise<string | null> {
  logger.logResolving(id);

  for (const plugin of plugins) {
    if (!plugin.resolve) continue;

    const resolved = await plugin.resolve(id, referrer);

    if (resolved) {
      if (resolved === id) {
        logger.logResolvedFinished(plugin.name, resolved);
        // Terminate resolution
        return resolved;
      }

      logger.logResolved(plugin.name, id, resolved);

      return await resolvePlugins(plugins, resolved, referrer);
    } else {
      logger.logNoResolved(plugin.name, id);
    }
  }

  return null;
}

function topoSort(graph: Graph, entry: string) {
  const sorted: string[] = [];

  const visited = new Set<string>();

  function visit(id: string) {
    visited.add(id);

    const deps = graph.get(id)!.deps;
    for (const dep of deps) {
      if (!visited.has(dep)) {
        visit(dep);
      }
    }

    sorted.push(id);
  }

  visit(entry);

  return sorted;
}
