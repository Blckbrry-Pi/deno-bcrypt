import buildWithRuntime from "./mod_runtime_generic.ts";
export type * from "./mod_runtime_generic.ts";
import { WebAssembly } from "@blckbrry/polywasm";

const { hash, verify } = await buildWithRuntime(WebAssembly as unknown as typeof globalThis.WebAssembly);

export { hash, verify };
