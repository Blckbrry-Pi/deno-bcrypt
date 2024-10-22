import buildWithRuntime from "./mod_runtime_generic.ts";
export type * from "./mod_runtime_generic.ts";

const { hash, verify } = await buildWithRuntime(WebAssembly);

export { hash, verify };
