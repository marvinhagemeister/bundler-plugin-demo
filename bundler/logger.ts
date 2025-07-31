import * as kl from "kolorist";

export function logResolving(spec: string) {
  console.log(
    `${kl.magenta("[resolve]")} resolving... ${prettySpecifier(spec)}`
  );
}

const logPlugin = kl.ansi256(202);
export function logResolved(pluginName: string, from: string, to: string) {
  console.log(
    `${kl.magenta("[resolve]")} ${logPlugin(pluginName)}: ${prettySpecifier(
      from
    )} -> ${prettySpecifier(to)}`
  );
}

export function logResolvedFinished(pluginName: string, from: string) {
  console.log(
    `${kl.magenta("[resolve]")} ${logPlugin(
      pluginName
    )}: success resolution ${prettySpecifier(from)}`
  );
}

export function logNoResolved(pluginName: string, id: string) {
  console.log(
    `${kl.magenta("[resolve]")} ${logPlugin(
      pluginName
    )}: could not resolve ${prettySpecifier(id)}, trying next plugin...`
  );
}

export function logNoLoad(pluginName: string, id: string) {
  console.log(
    `${kl.lightBlue("[load]")} ${logPlugin(
      pluginName
    )}: Could not load ${prettySpecifier(id)}, trying next plugin...`
  );
}

export function logLoaded(pluginName: string, id: string, content: string) {
  console.log(
    `${kl.lightBlue("[load]")} ${logPlugin(
      pluginName
    )}: Loaded ${prettySpecifier(id)}\n${content.trim()}`
  );
}

export function prettySpecifier(spec: string): string {
  if (spec.startsWith("\0")) {
    spec = `\\0${spec.slice(1)}`;
  }

  return kl.cyan(spec);
}

export function logBundlingEntry(entry: string) {
  console.log(
    `${kl.magenta("[bundler]")} bundling entrypoint ${prettySpecifier(entry)}`
  );
}

export function logFinished() {
  console.log(`Finished in ${kl.green(`${performance.now().toFixed(2)}ms`)}`);
}
