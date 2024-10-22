import { assert, assertEquals } from "jsr:@std/assert@1.0.1";

import type { BcryptVersion } from "./mod.ts";

import { hash, verify } from "./mod.ts";
import { hash as hashPolyfill, verify as verifyPolyfill } from "./mod_polyfill.ts";

const encoder = new TextEncoder();
const encode = (str: string) => encoder.encode(str);

const password = encode("password");
const password2 = encode("not-the-same-password");
const salt = encode("saltsaltsaltsalt");

type HashTest = { __type: "hash", version: BcryptVersion, cost: number, expect: string };
type VerifyTest = { __type: "verify", version: BcryptVersion, cost: number };

type Test = HashTest | VerifyTest;

const tests: Test[] = [
    { __type: "hash", version: "2b", cost: 10, expect: "$2b$10$a0DqbFLfZFPxWUvya0Dqb.IpP9MckeNpzVzfsitFCjAfJfE9QJxG6" },
    { __type: "hash", version: "2b", cost: 13, expect: "$2b$13$a0DqbFLfZFPxWUvya0Dqb.wTG4CV893mPts/.OQ2H8VnQmAsmuOFa" },

    { __type: "verify", version: "2b", cost: 10 },
    { __type: "verify", version: "2b", cost: 13 },
];

for (const test of tests) {
    if (test.__type === "hash") {
        Deno.test({
            name: `BCrypt ${test.version} hash ${test.cost}`,
            fn: async () => {
                assertEquals(
                    await hash(password, salt, {
                        version: test.version,
                        cost: test.cost,
                    }),
                    test.expect,
                );
                assertEquals(
                    await hashPolyfill(password, salt, {
                        version: test.version,
                        cost: test.cost,
                    }),
                    test.expect,
                );
            },
        });
    } else if (test.__type === "verify") {
        Deno.test({
            name: `BCrypt ${test.version} hash ${test.cost}`,
            fn: async () => {
                const outputHash = await hash(password, salt, {
                    version: test.version,
                    cost: test.cost,
                });
        
                assert(await verify(password, outputHash));
                assert(await verifyPolyfill(password, outputHash));
        
                assert(!await verify(password2, outputHash));
                assert(!await verifyPolyfill(password2, outputHash));
            },
        })
    }
}

// Deno.test({
//     name: "BCrypt 2b hash 10",
//     fn: async () => {
//         assertEquals(
//             await hash(password, salt, {
//                 version: "2b",
//                 cost: 10,
//             }),
//             "$2b$10$a0DqbFLfZFPxWUvya0Dqb.IpP9MckeNpzVzfsitFCjAfJfE9QJxG6",
//         );
//     },
// });

// Deno.test({
//     name: "BCrypt 2b hash 13",
//     fn: async () => {
//         assertEquals(
//             await hash(password, salt, {
//                 version: "2b",
//                 cost: 13,
//             }),
//             "$2b$13$a0DqbFLfZFPxWUvya0Dqb.wTG4CV893mPts/.OQ2H8VnQmAsmuOFa",
//         );
//     },
// });

// Deno.test({
//     name: "BCrypt 2b verify 10",
//     fn: async () => {
//         const outputHash = await hash(password, salt, {
//             version: "2b",
//             cost: 10,
//         });


//         assert(await verify(password, outputHash));

//         assert(!await verify(password2, outputHash));
//     },
// });

// Deno.test({
//     name: "BCrypt 2b verify 13",
//     fn: async () => {
//         const outputHash = await hash(password, salt, {
//             version: "2b",
//             cost: 13,
//         });

//         assert(await verify(password, outputHash));

//         assert(!await verify(password2, outputHash));
//     },
// });
