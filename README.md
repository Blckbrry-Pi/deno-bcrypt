# BCrypt

This module provides [BCrypt](https://en.wikipedia.org/wiki/Bcrypt) hashing
support for deno and the web by providing [simple bindings](wasm/lib.rs) using
[bcrypt](https://github.com/Keats/rust-bcrypt) compiled to webassembly.

## Usage

```ts
import { hash } from "jsr:@blackberry/bcrypt@0.16.0";

const encoder = new TextEncoder();

const password = encoder.encode("very-cool-password");
const salt = encoder.encode("salty salt woo!!");

console.log(hash(password, salt));

// Should log:
// $2b$12$a0DqbFiea0DqbA/1Z06fGOZcRMnat359MTbqezYI1qXvLuOL16Eve
```

## Comparisons

### Hashing (per iter):

| Cost | x/bcrypt | x/bcrypt_ffi | @blackberry/bcrypt | Relative speeds |
|------|----------|--------------|--------------------|-----------------|
|    4 |  14.83ms |           NA |             1.11ms | 1.00x/NA/13.35x |
|    6 |  18.62ms |           NA |             4.27ms | 1.00x/NA/4.36x  |
|    8 |  32.05ms |           NA |            16.93ms | 1.00x/NA/1.89x  |
|   10 |  84.84ms |           NA |            67.94ms | 1.00x/NA/1.25x  |
|   12 | 298.34ms |           NA |           270.70ms | 1.00x/NA/1.10x  |
|   13 | 568.96ms |           NA |           540.74ms | 1.00x/NA/1.07x  |

### Verifying (per iter):

Will get to later

## Maintainers

- Skyler Calaman ([@skylercalaman](https://github.com/Blckbrry-Pi))

### Original argon2 bindings by:

- Elias Sjögreen ([@eliassjogreen](https://github.com/eliassjogreen))

## Other

### Contribution

Pull request, issues and feedback are very welcome. Code style is formatted with
`deno fmt` and commit messages ~~are~~ *WERE* written following
[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) spec.

The author of this library is not responsible enough to use them anymore.

### License

Copyright 2024, Skyler Calaman. All rights reserved. MIT license.
