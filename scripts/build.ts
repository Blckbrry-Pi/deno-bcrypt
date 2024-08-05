import { encodeBase64 } from "@std/encoding/base64";
import { compress } from "@denosaurs/lz4";

const name = "bcrypt";

await new Deno.Command("cargo", {
  args: ["build", "--release", "--target", "wasm32-unknown-unknown"],
}).spawn().status;


const targetFolder = Deno.env.get("CARGO_TARGET_DIR") || "target";

const wasm = await Deno.readFile(
  `./${targetFolder}/wasm32-unknown-unknown/release/${name}.wasm`,
);
const encoded = encodeBase64(compress(wasm));
const js = `// deno-fmt-ignore-file\n// deno-lint-ignore-file
import { decodeBase64 } from "jsr:@std/encoding@0.221/base64";
import { decompress } from "jsr:@denosaurs/lz4@0.1.4";
export const source = decompress(decodeBase64("${encoded}"));`;

await Deno.writeTextFile("wasm/wasm.js", js);
