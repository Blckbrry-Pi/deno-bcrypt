import buildWithRuntime, { type BCryptRuntime } from "./mod_runtime_generic.ts";
export type * from "./mod_runtime_generic.ts";

const nativeRuntime: BCryptRuntime = await buildWithRuntime(WebAssembly);
const hash = nativeRuntime.hash;
const verify = nativeRuntime.verify;

export { hash, verify };
