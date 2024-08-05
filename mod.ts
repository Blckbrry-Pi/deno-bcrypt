import * as wasm from "./wasm/mod.ts";

function bufferSourceArrayBuffer(data: BufferSource) {
    if (ArrayBuffer.isView(data)) {
        return data.buffer;
    } else if (data instanceof ArrayBuffer) {
        return data;
    }

    throw new TypeError(
        `Could extract ArrayBuffer from alleged BufferSource type. Got ${data} instead.`,
    );
}

/**
 * Transfers an {@link ArrayBufferLike} to wasm, automatically allocating it in memory.
 *
 * Remember to unallocate the transfered buffer with {@link wasm.dealloc}
 */
function transfer(buffer: BufferSource): [number, number] {
    const length = buffer.byteLength;
    const pointer = wasm.alloc(length);
    new Uint8Array(wasm.memory.buffer, pointer, length).set(
        new Uint8Array(bufferSourceArrayBuffer(buffer)),
    );
    return [pointer, length];
}

const OUTPUT_BYTES = 100;
const OUTPUT_LEN_BYTES = 8;
const MATCHES_BYTES = 4;

const SALT_BYTES = 16;

/**
 * The 4 different versions of the BCrypt algorithm:
 *
 * These are all treated the exact same, as the only difference is the version
 * byte in the hash.
 */
export type BcryptVersion = "2a" | "2x" | "2y" | "2b";

export type BcryptParams = {
    version: BcryptVersion;
    /**
     * The desired cost/work factor of the bcrypt hash
     *
     * @default 12
     */
    cost: number;
};

const versionEnum: Record<BcryptVersion, number> = {
    "2a": "a".charCodeAt(0),
    "2x": "x".charCodeAt(0),
    "2y": "y".charCodeAt(0),
    "2b": "b".charCodeAt(0),
};

/**
 * Verifies the bcrypt hash for the password, salt and parameters.
 */
export function hash(
    password: BufferSource,
    salt?: BufferSource,
    params?: BcryptParams,
): string {
    const finalParams = {
        version: params?.version ?? "2b",
        cost: params?.cost ?? 12,
    };

    const verifiedSalt = salt ??
        crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    if (verifiedSalt.byteLength !== SALT_BYTES) {
        throw new Error(`Salt must be ${SALT_BYTES} bytes long.`);
    }

    const [passwordPtr, passwordLen] = transfer(password);
    const [saltPtr, saltLen] = transfer(verifiedSalt);
    const finalOutputLenPtr = wasm.alloc(OUTPUT_LEN_BYTES);
    const outputPtr = wasm.alloc(OUTPUT_BYTES);

    wasm.hash(
        passwordPtr,
        passwordLen,
        saltPtr,
        saltLen,
        outputPtr,
        OUTPUT_BYTES,
        finalOutputLenPtr,
        versionEnum[finalParams.version],
        finalParams.cost,
    );

    wasm.dealloc(passwordPtr, passwordLen);
    wasm.dealloc(saltPtr, saltLen);

    // Copy output length from wasm memory into js
    const outputLenBuffer = new ArrayBuffer(OUTPUT_LEN_BYTES);
    new Uint8Array(outputLenBuffer).set(
        new Uint8Array(wasm.memory.buffer, finalOutputLenPtr, OUTPUT_LEN_BYTES),
    );
    const outputLen = new DataView(outputLenBuffer).getUint32(0, true); // WASM uses little-endian

    // Copy output from wasm memory into js
    const output = new ArrayBuffer(outputLen);
    new Uint8Array(output).set(
        new Uint8Array(wasm.memory.buffer, outputPtr, outputLen),
    );

    wasm.dealloc(outputPtr, OUTPUT_BYTES);

    return new TextDecoder().decode(output);
}

/**
 * Verifies a bcrypt hash against a password.
 */
export function verify(
    password: BufferSource,
    hash: string,
): boolean {
    const [passwordPtr, passwordLen] = transfer(password);
    const [hashPtr, hashLen] = transfer(new TextEncoder().encode(hash));
    const matchesPtr = wasm.alloc(MATCHES_BYTES);

    wasm.verify(
        passwordPtr,
        passwordLen,
        hashPtr,
        hashLen,
        matchesPtr,
    );

    wasm.dealloc(passwordPtr, passwordLen);
    wasm.dealloc(hashPtr, hashLen);

    // Copy result from wasm memory into js
    const matchesBuffer = new ArrayBuffer(MATCHES_BYTES);
    new Uint8Array(matchesBuffer).set(
        new Uint8Array(wasm.memory.buffer, matchesPtr, MATCHES_BYTES),
    );
    const matches = !!new DataView(matchesBuffer).getUint8(0);

    wasm.dealloc(matchesPtr, MATCHES_BYTES);

    return matches;
}
