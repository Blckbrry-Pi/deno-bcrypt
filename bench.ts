import { hash as hashJs, compare as verifyJs, genSalt } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { hash as hashWasm, verify as verifyWasm } from "./mod.ts";

// FFI doesn't work on my computer because i'm running on arm64
// import { hash as hashFfi, verify as verifyFfi } from "https://deno.land/x/bcrypt_ffi@v0.3.0/mod.ts";

const password =
	"2gnF!WAcyhp#kB@tcYQa2$A%P64jEmXY!@8n2GSH$GggfgGfP*qH!EWwDaB%5mdB6pW2fK!KD@YNjvqwREfRCCAPc54c5@Sk";
const hashed = "$2y$10$1/Er.wWMtY0TbOls1ohxGeFMX2eAWTiTKPpKgWPtJ8QteCbFjzoda";

const salt = "saltsaltsaltsalt";

const costs = [4, 6, 8, 10, 12, 13];

for (const cost of costs) {
    const wasmSalt = new TextEncoder().encode(salt);
    const jsSalt = await genSalt(cost);

    Deno.bench("wasm", {
        group: `hashing (cost ${cost})`,
        baseline: true,
    }, async () => {
        hashWasm(new TextEncoder().encode(password), wasmSalt, { cost, version: "2y" });
    });
    Deno.bench("js", {
        group: `hashing (cost ${cost})`,
        baseline: true,
    }, async () => {
        await hashJs(password, jsSalt);
    });
}
// Deno.bench("ffi", {
// 	group: "hashing",
// 	baseline: true,
// }, async () => {
// 	await hashFfi(password);
// });

Deno.bench("wasm", {
	group: "verifying",
	baseline: true,
}, async () => {
	verifyWasm(new TextEncoder().encode(password), hashed);
});
Deno.bench("js", {
	group: "verifying",
	baseline: true,
}, async () => {
	await verifyJs(password, hashed);
});
// Deno.bench("ffi", {
// 	group: "verifying",
// 	baseline: true,
// }, async () => {
// 	await verifyFfi(password, hashed);
// });
