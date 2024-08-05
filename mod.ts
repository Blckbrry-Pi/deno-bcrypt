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

const MAX_OUTPUT_BYTES = 100;
const MAX_MATCHES_BYTES = 16;

/**
 * The three different Argon2 algorithm variants as described by [wikipedia](https://en.wikipedia.org/wiki/Argon2):
 *
 * - **Argon2d**: Argon2d maximizes resistance to GPU cracking attacks. It accesses the memory array in a password dependent order, which reduces the possibility of time–memory trade-off (TMTO) attacks, but introduces possible side-channel attacks.
 * - **Argon2i**: Argon2i is optimized to resist side-channel attacks. It accesses the memory array in a password independent order.
 * - **Argon2id**: (default) Argon2id is a hybrid version. It follows the Argon2i approach for the first half pass over memory and the Argon2d approach for subsequent passes. RFC 9106 recommends using Argon2id if you do not know the difference between the types or you consider side-channel attacks to be a viable threat.
 */
export type Argon2Algorithm = "Argon2d" | "Argon2i" | "Argon2id";

/**
 * The two different versions of the Argon2 algorithm:
 *
 * - **0x10**: Version 16, performs overwrites internally.
 * - **0x13** (default): Version 19, performs XOR internally.
 */
export type BcryptVersion = "2a" | "2x" | "2y" | "2b";

export type BcryptParams = {
  version: BcryptVersion;
  /**
   * The desired cost/work factor of the bcrypt hash
   *
   * @default 10
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
    cost: params?.cost ?? 10,
  };

  const verifiedSalt = salt ?? crypto.getRandomValues(new Uint8Array(16));
  if (verifiedSalt.byteLength !== 16) {
    throw new Error("Salt must be 16 bytes long.");
  }

  const [passwordPtr, passwordLen] = transfer(password);
  const [saltPtr, saltLen] = transfer(verifiedSalt);
  const finalOutputLenPtr = wasm.alloc(16);
  const outputPtr = wasm.alloc(MAX_OUTPUT_BYTES);

  wasm.hash(
    passwordPtr,
    passwordLen,
    saltPtr,
    saltLen,
    outputPtr,
    MAX_OUTPUT_BYTES,
    finalOutputLenPtr,
    versionEnum[finalParams.version],
    finalParams.cost,
  );

  wasm.dealloc(passwordPtr, passwordLen);
  wasm.dealloc(saltPtr, saltLen);

  // Copy output length from wasm memory into js
  const outputLenBuffer =  new ArrayBuffer(16);
  new Uint8Array(outputLenBuffer).set(
    new Uint8Array(wasm.memory.buffer, finalOutputLenPtr, 16),
  );
  const outputLen = new DataView(outputLenBuffer).getUint32(0, true); // WASM uses little-endian

  // Copy output from wasm memory into js
  const output = new ArrayBuffer(outputLen);
  new Uint8Array(output).set(
    new Uint8Array(wasm.memory.buffer, outputPtr, outputLen),
  );

  wasm.dealloc(outputPtr, MAX_OUTPUT_BYTES);

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
  const matchesPtr = wasm.alloc(MAX_MATCHES_BYTES);

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
  const matchesBuffer =  new ArrayBuffer(MAX_MATCHES_BYTES);
  new Uint8Array(matchesBuffer).set(
    new Uint8Array(wasm.memory.buffer, matchesPtr, MAX_MATCHES_BYTES),
  );
  const matches = !!new DataView(matchesBuffer).getUint8(0);

  wasm.dealloc(matchesPtr, MAX_MATCHES_BYTES);
  
  return matches;
}
