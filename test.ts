import { assert, assertEquals } from "jsr:@std/assert@1.0.1";

import { hash, verify } from "./mod.ts";

const encoder = new TextEncoder();
const encode = (str: string) => encoder.encode(str);

const password = encode("password");
const password2 = encode("not-the-same-password");
const salt = encode("saltsaltsaltsalt");

Deno.test({
    name: "BCrypt 2b hash 10",
    fn: () => {
        assertEquals(
            hash(password, salt, {
                version: "2b",
                cost: 10,
            }),
            "$2b$10$a0DqbFLfZFPxWUvya0Dqb.IpP9MckeNpzVzfsitFCjAfJfE9QJxG6",
        );
    },
});

Deno.test({
    name: "BCrypt 2b hash 13",
    fn: () => {
        assertEquals(
            hash(password, salt, {
                version: "2b",
                cost: 13,
            }),
            "$2b$13$a0DqbFLfZFPxWUvya0Dqb.wTG4CV893mPts/.OQ2H8VnQmAsmuOFa",
        );
    },
});

Deno.test({
    name: "BCrypt 2b verify 10",
    fn: () => {
        const outputHash = hash(password, salt, {
            version: "2b",
            cost: 10,
        });

        assert(verify(password, outputHash));

        assert(!verify(password2, outputHash));
    },
});

Deno.test({
    name: "BCrypt 2b verify 13",
    fn: () => {
        const outputHash = hash(password, salt, {
            version: "2b",
            cost: 13,
        });

        assert(verify(password, outputHash));

        assert(!verify(password2, outputHash));
    },
});
