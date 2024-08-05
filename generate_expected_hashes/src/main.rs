fn two_b_hash(password: &str, salt: &str, cost: u32) -> String {
    bcrypt::hash_with_salt(
        password.as_bytes(),
        cost,
        salt.as_bytes().try_into().unwrap(),
    )
        .unwrap()
        .format_for_version(bcrypt::Version::TwoB)
}

fn main() {
    println!("Hello, world!");
    println!("hash: {:?}", two_b_hash("password", "saltsaltsaltsalt", 10));
    println!("hash: {:?}", two_b_hash("password", "saltsaltsaltsalt", 13));
    println!("hash: {:?}", two_b_hash("very-cool-password", "salty salt woo!!", 12));
}
