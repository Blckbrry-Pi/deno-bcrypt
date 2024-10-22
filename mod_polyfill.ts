import buildWithRuntime, { type BCryptRuntime } from "./mod_runtime_generic.ts";
export type * from "./mod_runtime_generic.ts";
import { WebAssembly } from "@blckbrry/polywasm";

const polyfillRuntime: BCryptRuntime = await buildWithRuntime(WebAssembly as unknown as typeof globalThis.WebAssembly);
const hash = polyfillRuntime.hash;
const verify = polyfillRuntime.verify;

export { hash, verify };
