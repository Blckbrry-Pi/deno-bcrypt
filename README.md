# argontwo

This module provides [BCrypt](https://en.wikipedia.org/wiki/Bcrypt) hashing
support for deno and the web by providing [simple bindings](src/lib.rs) using
[bcrypt](https://github.com/Keats/rust-bcrypt) compiled to webassembly.

## Usage

```ts
import { hash } from "jsr:@blackberry/bcrypt@0.15.2";

const encoder = new TextEncoder();

const password = encoder.encode("very-cool-password");
const salt = encoder.encode("salty salt woo!!");

console.log(hash(password, salt));

// Should log:
// $2b$12$a0DqbFiea0DqbA/1Z06fGOZcRMnat359MTbqezYI1qXvLuOL16Eve
```

## Maintainers

- Skyler Calaman ([@skylercalaman](https://github.com/Blckbrry-Pi))

### Original argon2 bindings by:

- Elias Sjögreen ([@eliassjogreen](https://github.com/eliassjogreen))

## Other

### Contribution

Pull request, issues and feedback are very welcome. Code style is formatted with
`deno fmt` and commit messages ~~are~~ WERE written following
[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) spec.

The author of this library is not responsible enough to use them anymore.

### License

Copyright 2024, Skyler Calaman. All rights reserved. MIT license.
