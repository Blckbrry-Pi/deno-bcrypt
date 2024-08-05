import { source } from "./wasm.js";

const { instance } = await WebAssembly.instantiate(source, {
    env: {
        panic: (ptr: number, len: number) => {
            const msg = new TextDecoder().decode(
                new Uint8Array(memory.buffer, ptr, len),
            );
            dealloc(ptr, len);
            throw new Error(msg);
        },
    },
});

export const memory = instance.exports.memory as WebAssembly.Memory;
export const alloc = instance.exports.alloc as (size: number) => number;
export const dealloc = instance.exports.dealloc as (
    ptr: number,
    size: number,
) => void;

export const hash = instance.exports.hash as (
    passwordPtr: number,
    passwordLen: number,
    saltPtr: number,
    saltLen: number,
    outputPtr: number,
    outputLen: number,
    finalOutputLen: number,
    version: number,
    cost: number,
) => void;

export const verify = instance.exports.verify as (
    passwordPtr: number,
    passwordLen: number,
    hashPtr: number,
    hashLen: number,
    matches: number,
) => void;
